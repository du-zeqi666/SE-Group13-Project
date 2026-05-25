import re
from collections import Counter

from config import Config

_embedding_model = None

# Keyword lists for NL query parsing
CELL_TYPES = [
    "t cell", "b cell", "nk cell", "natural killer", "monocyte", "macrophage",
    "dendritic cell", "neutrophil", "endothelial", "fibroblast", "stem cell",
    "progenitor", "hepatocyte", "kupffer", "hepatic stellate", "cholangiocyte",
    "cd4", "cd8", "plasma cell", "erythrocyte", "mast cell", "regulatory t",
]
DISEASES = [
    "alzheimer", "cancer", "diabetes", "covid", "parkinson", "hypertension",
    "arthritis", "leukemia", "lymphoma", "asthma", "tuberculosis", "malaria",
    "obesity", "healthy", "normal",
]
AGE_GROUPS = [
    "newborn", "infant", "child", "adult", "aged", "elderly", "pediatric",
    "fetal", "neonatal", "adolescent",
]


def _extract_keywords(text):
    """Simple regex-based keyword extraction for filter fields."""
    text_lower = text.lower()
    result = {}

    for ct in sorted(CELL_TYPES, key=len, reverse=True):
        if ct in text_lower:
            result["cell_type"] = ct.title()
            break

    for d in sorted(DISEASES, key=len, reverse=True):
        if d in text_lower:
            result["disease"] = d.title()
            break

    for ag in sorted(AGE_GROUPS, key=len, reverse=True):
        if ag in text_lower:
            result["AgeGroup"] = ag.title()
            break

    donor_match = re.search(r'donor[_\s]+(\w{2,})', text_lower)
    if donor_match:
        result["donor_id"] = donor_match.group(1)

    k_match = re.search(r'(\d+)\s*(result|neighbor|cell|top|item|match)', text_lower)
    if k_match:
        k_val = int(k_match.group(1))
        result["k"] = min(k_val, 100)

    return result


def parse_nl_query(query_text):
    """Parse natural language query into search parameters."""
    if not query_text or not query_text.strip():
        return {"filters": {}, "k": 10, "query_text": query_text, "embedding_source": "local"}

    if Config.RAG_LLM_ENABLED and Config.RAG_LLM_API_URL:
        try:
            return _llm_parse_query(query_text)
        except Exception:
            pass

    keywords = _extract_keywords(query_text)
    filters = {k: v for k, v in keywords.items() if k in ("cell_type", "disease", "AgeGroup", "donor_id")}
    k = keywords.get("k", 10)

    return {
        "filters": filters,
        "k": k,
        "query_text": query_text,
        "embedding_source": "local",
    }


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer(Config.RAG_EMBEDDING_MODEL)
    return _embedding_model


def embed_query(text):
    """Convert NL query text to embedding vector."""
    if not text or not text.strip():
        return []
    model = get_embedding_model()
    embedding = model.encode(text.strip())
    return embedding.tolist()


def analyze_results(results, query_text, k):
    """Generate AI analysis of search results.

    Returns a dict with summary, distributions, distance stats, and interpretation.
    """
    if not results:
        return {
            "summary": "No results found for the query.",
            "cell_type_distribution": {},
            "disease_distribution": {},
            "AgeGroup_distribution": {},
            "distance_stats": {"min": 0, "max": 0, "mean": 0},
            "interpretation": "No matching cells were found. Try broadening your query or checking that the joint index contains relevant data.",
        }

    cell_types = Counter()
    diseases = Counter()
    age_groups = Counter()
    distances = []

    for r in results:
        if r.get("cell_type"):
            cell_types[r["cell_type"]] += 1
        if r.get("disease"):
            diseases[r["disease"]] += 1
        if r.get("AgeGroup"):
            age_groups[r["AgeGroup"]] += 1
        if r.get("distance") is not None:
            distances.append(float(r["distance"]))

    if distances:
        dist_stats = {
            "min": round(min(distances), 4),
            "max": round(max(distances), 4),
            "mean": round(sum(distances) / len(distances), 4),
        }
    else:
        dist_stats = {"min": 0, "max": 0, "mean": 0}

    summary_parts = []
    if cell_types:
        top_ct = cell_types.most_common(1)[0]
        summary_parts.append(f"Top cell type: {top_ct[0]} ({top_ct[1]} of {len(results)} results)")
    if diseases:
        top_d = diseases.most_common(1)[0]
        summary_parts.append(f"Most common condition: {top_d[0]}")
    if not summary_parts:
        summary_parts.append(f"Found {len(results)} similar cells")

    summary = ". ".join(summary_parts) + "."

    if Config.RAG_LLM_ENABLED and Config.RAG_LLM_API_URL:
        try:
            interpretation = _llm_analyze(results, query_text)
        except Exception:
            interpretation = _generate_interpretation(
                dict(cell_types.most_common(5)),
                dict(diseases.most_common(5)),
                dist_stats,
                len(results),
                k,
                query_text,
            )
    else:
        interpretation = _generate_interpretation(
            dict(cell_types.most_common(5)),
            dict(diseases.most_common(5)),
            dist_stats,
            len(results),
            k,
            query_text,
        )

    return {
        "summary": summary,
        "cell_type_distribution": dict(cell_types.most_common(10)),
        "disease_distribution": dict(diseases.most_common(10)),
        "AgeGroup_distribution": dict(age_groups.most_common(5)),
        "distance_stats": dist_stats,
        "interpretation": interpretation,
    }


def _generate_interpretation(cell_types, diseases, dist_stats, result_count, k, query_text):
    """Template-based natural language interpretation from statistics."""
    lines = []

    if result_count >= k:
        lines.append(f"The search returned all {k} requested results, suggesting a good match density in the database.")
    else:
        lines.append(f"The search returned {result_count} out of {k} requested results, indicating limited matches for this query.")

    if cell_types:
        top_types = list(cell_types.items())
        if len(top_types) == 1:
            lines.append(f"All matching cells are of the same type: {top_types[0][0]}, suggesting high specificity.")
        else:
            type_list = ", ".join(f"{t} ({c})" for t, c in top_types[:3])
            lines.append(f"The matched cells span multiple types: {type_list}.")

    if dist_stats.get("mean", 0) > 0:
        lines.append(
            f"Distance values range from {dist_stats['min']} to {dist_stats['max']} "
            f"(mean: {dist_stats['mean']}), with lower values indicating closer similarity."
        )

    if query_text:
        lines.insert(0, f"Based on your query \"{query_text}\":")

    return " ".join(lines)


def _call_llm(prompt, system_prompt=""):
    """Call OpenAI-compatible API."""
    import requests
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {Config.RAG_LLM_API_KEY}",
    }
    body = {
        "model": Config.RAG_LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 500,
    }
    resp = requests.post(
        f"{Config.RAG_LLM_API_URL.rstrip('/')}/v1/chat/completions",
        json=body,
        headers=headers,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def _llm_parse_query(query_text):
    """Use LLM to parse NL query into structured search parameters."""
    system_prompt = (
        "You are a single-cell data search assistant. Extract search parameters from user queries. "
        "Return ONLY a JSON object with keys: filters (dict with optional cell_type, disease, AgeGroup, donor_id), "
        "k (integer, default 10). Do not include markdown formatting."
    )
    prompt = f"Parse this query: \"{query_text}\""
    response = _call_llm(prompt, system_prompt)
    import json
    try:
        parsed = json.loads(response.strip().removeprefix("```json").removesuffix("```").strip())
        return {
            "filters": parsed.get("filters", {}),
            "k": parsed.get("k", 10),
            "query_text": query_text,
            "embedding_source": "llm",
        }
    except (json.JSONDecodeError, ValueError):
        keywords = _extract_keywords(query_text)
        return {
            "filters": {k: v for k, v in keywords.items() if k in ("cell_type", "disease", "AgeGroup", "donor_id")},
            "k": keywords.get("k", 10),
            "query_text": query_text,
            "embedding_source": "local",
        }


def _llm_analyze(results, query_text):
    """Use LLM to generate interpretation of search results."""
    system_prompt = (
        "You are a single-cell data analysis assistant. Given a query and search results, "
        "provide a concise biological interpretation. Focus on cell type patterns, possible "
        "biological relevance, and any notable findings. Keep it under 150 words."
    )
    summary = {
        "count": len(results),
        "cell_types": Counter(r.get("cell_type", "unknown") for r in results).most_common(5),
        "diseases": Counter(r.get("disease", "") for r in results if r.get("disease")).most_common(3),
    }
    prompt = f"Query: \"{query_text}\"\nResults summary: {summary}\n\nProvide an interpretation:"
    return _call_llm(prompt, system_prompt)
