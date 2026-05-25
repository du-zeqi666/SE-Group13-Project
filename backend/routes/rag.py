import uuid
import numpy as np
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db
from models.metadata import SearchHistory, JointIndex
from services.chroma_service import search_collection, CHROMA_AVAILABLE
from services.rag_service import parse_nl_query, analyze_results

rag_bp = Blueprint("rag", __name__, url_prefix="/api/rag")

MAX_HISTORY = 10


def _add_to_history(user_id, entry):
    history_entry = SearchHistory(
        id=entry["id"],
        user_id=user_id,
        entry_type=entry["type"],
        joint_index_id=entry.get("joint_index_id"),
        k=entry["k"],
        query_time_ms=entry["query_time_ms"],
        query_text=entry.get("query_text"),
    )
    db.session.add(history_entry)
    db.session.flush()

    stale_entries = (
        SearchHistory.query.filter_by(user_id=user_id)
        .order_by(SearchHistory.timestamp.desc())
        .offset(MAX_HISTORY)
        .all()
    )
    for stale_entry in stale_entries:
        db.session.delete(stale_entry)

    db.session.commit()


def _make_query_vector(n_features, query_text, provided_vector=None):
    """Generate a query vector matching the collection dimension.

    Since text embeddings (e.g. 384-dim) cannot directly search cell-feature vectors,
    we use the NL parsing for metadata filters. For the vector component, we generate
    a random vector seeded from the query text so the same query returns deterministic
    rankings, or use the caller-provided vector.
    """
    if provided_vector and isinstance(provided_vector, list) and len(provided_vector) == n_features:
        return provided_vector

    seed = hash(query_text) % (2**31)
    rng = np.random.default_rng(seed)
    return rng.normal(0, 1, n_features).astype(np.float32).tolist()


@rag_bp.route("/search", methods=["POST"])
@jwt_required()
def rag_search():
    if not CHROMA_AVAILABLE:
        return jsonify({"error": "ChromaDB is not installed"}), 503

    user_id = get_jwt_identity()
    body = request.get_json(silent=True) or {}

    query_text = (body.get("query") or "").strip()
    joint_index_id = body.get("joint_index_id")
    k = int(body.get("k", 10))
    query_vector = body.get("query_vector")

    if not query_text:
        return jsonify({"error": "query is required"}), 400
    if not joint_index_id:
        return jsonify({"error": "joint_index_id is required"}), 400
    if k < 1 or k > 100:
        return jsonify({"error": "k must be between 1 and 100"}), 400

    idx = JointIndex.query.filter_by(id=joint_index_id, owner_id=user_id).first()
    if not idx:
        return jsonify({"error": "Joint index not found"}), 404

    # Step 1: Parse NL query → extract filters + k
    parsed = parse_nl_query(query_text)
    parsed_k = parsed.get("k", k)

    # Step 2: Generate query vector matching the collection dimension
    query_vec = _make_query_vector(idx.n_features, query_text, query_vector)

    # Step 3: Search joint index with filters
    try:
        results, query_time_ms = search_collection(
            collection_name=idx.collection_name,
            query_vector=query_vec,
            k=max(parsed_k, k),
            filters=parsed.get("filters"),
        )
        results = results[:k]
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Search failed: {str(e)}"}), 500

    # Step 4: Generate analysis
    analysis = analyze_results(results, query_text, k)

    # Step 5: Record history
    _add_to_history(user_id, {
        "id": str(uuid.uuid4()),
        "type": "rag",
        "joint_index_id": joint_index_id,
        "k": k,
        "query_time_ms": query_time_ms,
        "query_text": query_text,
    })

    return jsonify({
        "results": results,
        "query_time_ms": query_time_ms,
        "k": k,
        "parsed_query": {
            "filters": parsed.get("filters", {}),
            "k": parsed.get("k", k),
            "embedding_source": parsed.get("embedding_source", "local"),
        },
        "analysis": analysis,
    })


@rag_bp.route("/analyze", methods=["POST"])
@jwt_required()
def rag_analyze():
    body = request.get_json(silent=True) or {}
    results = body.get("results") or []
    query_text = body.get("query", "")
    k = int(body.get("k", len(results) or 10))

    if not results:
        return jsonify({"error": "results is required"}), 400

    analysis = analyze_results(results, query_text, k)
    return jsonify({"analysis": analysis})
