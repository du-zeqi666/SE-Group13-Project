
# TemplateNKU 模板使用指南

> **作者**：谢孔伟，程明明，戴一冕*

## 摘要

本模板（TemplateNKU）是基于我们早先蓝色主题模板 [TemplateMC](https://github.com/GrokCV/TemplateMC)，为全面适配南开紫色主题迭代优化而来的全新版本。

在保留原有学术风格设计的基础上，本版本针对 16:9 画幅的排版特性进行了底层重构。主要改进包括：优化中英文字体控制配置，引入基于数学坐标计算的动态自适应目录宏，大幅压缩并优化了多级列表与浮动体的垂直间距，同时修复了跨页注脚重叠、无标题页正文跳动等遗留排版 Bug。旨在提供一个更方便、高度自动化且开箱即用的学术汇报排版框架。




[目录](#目录) | [文件结构](#文件结构) | [主文件结构](#主文件结构) | [配置文件](#配置文件) |[字体设置](#字体设置) | [更新日志](#更新日志)

## 目录

- [文件结构](#文件结构)
- [快速使用本模板](#快速使用本模板)
  - [1. 编译方式](#1-编译方式)
  - [2. 修改内容](#2-修改内容)
  - [3. 修改页眉和页脚配置](#3-修改页眉和页脚配置)
  - [4. 字体色块](#4-字体色块)
  - [5. 更改字体](#5-字体风格)
  - [6. 插入图片](#6-插入图片)
  - [7. 插入脚注](#7-插入脚注)
- [主文件结构](#主文件结构)
  - [1. 动态封面页](#1-动态封面页)
  - [2. 自适应目录页](#2-自适应目录页)
  - [3. 核心内容与表格页](#3-核心内容与表格页)
  - [4. 图文并排与多图页](#4-图文并排与多图页)
  - [5. 算法伪代码页](#5-算法伪代码页)
  - [6. 公式推导展示页](#6-公式推导展示页)
  - [7. 文字强调块](#7-文字强调块)
  - [8. 参考文献](#8-参考文献)
  - [9. 问答页](#9-问答页)
  - [10. 结束页](#10-结束页)
- [配置文件 (`config.tex`)](#配置文件)
  - [1. 颜色定义](#1-颜色定义)
  - [2. 字体设置](#2-字体设置)
  - [3. 页脚设置](#3-页脚设置)
  - [4. 压缩列表样式](#4-压缩列表样式)
  - [5. 公式背景](#5-公式背景)

---

## 文件结构

本模板移除了对 `minted` 包及 Python 环境的依赖，极大提升了本地与在线环境的编译稳定性。包含以下主要文件及目录：

1. **`image/`**
   * 存放所有正文图片文件。
   * **`image/Cover image/`**：核心文件夹，存放封面专用的视觉元素（`Logo.png`, `element_1.png`, `element_2.png`）。缺失会导致封面编译报错。
2. **`TemplateNKU.tex`**
   * 主文件。得益于底层宏的封装，主文件不再包含复杂的环境配置，结构极为清晰，专注于内容的填充。
3. **`config.tex`**
   * 全局配置文件。负责接管所有的 TikZ 绘图逻辑、颜色定义、字体映射、间距压缩参数以及自定义命令（如 `\DrawCoverPage`、`\DrawTOC` 等）。

```bash
/your-project-directory  
    |_ TemplateNKU.tex  
    |_ config.tex  
    |_ /image  
        |_ demo.jpg 
        |_ /Cover image
            |_ Logo.png  
            |_ element_1.png
            |_ element_2.png
```

---

## 快速使用本模板

预设的基础色调已全面迁移至紫色系（Purple），专为 16:9 画幅优化。

### 1. 编译方式

- 强制使用 **XeLaTeX** 编译（已在模板层配置相关中文字体支持）。
- 若在 Overleaf 编译，请在 Menu 中将 Compiler 设置为 **XeLaTeX**

### 2. 修改内容

#### 全局间距初始化
在 `\begin{document}` 之后，建议保留如下行距与段距设置，这是针对 16:9 垂直空间压榨后的最优参数：
```latex
\linespread{1.2}
\setlength{\parskip}{0.5em plus 0.2em minus 0.1em}
```

#### 修改标题页与横线
- 直接修改 `\begin{frame}{标题内容}` 中的文字。
- **无标题页正文跳动修复**：当使用无标题页面 `\begin{frame}` 时，顶部会自动生成等量的隐形占位符（0.9cm），确保正文内容在翻页时基线绝对对齐，不再发生上下跳动。

#### 选择与配置自适应目录页
配置自适应目录页
本模板新增了基于底层计算的自适应目录宏 \DrawTOC 和 \DrawListTOC，无需手动嵌套 frame 环境，自带高亮与自动折行排版。具体效果与代码示例见下文 [自适应目录页](#2-自适应目录页)。


### 3. 修改页眉和页脚配置

页眉与页脚的渲染逻辑已封装在 `config.tex` 中。

要修改页脚内容，请在 `config.tex` 搜索 `\setbeamertemplate{footline}`，修改对应的 `\node` 文本内容：

```latex
\node[anchor=center, yshift=0.5pt, font=\tiny, text=white] at (leftblock.center) {戴一冕 [https://grokcv.site/](https://grokcv.site/)};
\node[anchor=center, yshift=0.5pt, font=\tiny, text=white] at (midblock.center) {红外弱小目标检测};
```

### 4. 字体色块

使用重构后的 `\BehindEqBox` 命令为公式或核心文本添加高亮背景：

```latex
\BehindEqBox{ $\displaystyle E = mc^2 $ }
```

| 参数名     | 含义           | 默认值       | 示例值           |
|------------|----------------|--------------|------------------|
| `color`    | 背景与边框颜色 | `midpurple`  | `myred`， `gray` |
| `border`   | 边框粗细       | `1pt`        | `2pt`， `0.5pt`  |
| `style`    | 边框样式       | `solid`      | `dashed`         |
| `padding`  | 内边距         | `2.8mm`      | `0pt`， `4mm`    |

### 5. 字体风格

新版移除了僵硬的 `\iftoggle` 开关，提供更方便的命令。在 `TemplateNKU.tex` 导言区直接调用即可：
```latex
\ThemeSongRoman      % 学术风：Times New Roman + 思源宋体
% \ThemeBlackSans    % 全黑体：Liberation Sans + 思源黑体
% \UseHeiRomanFont   % 混合风：Times New Roman + 思源黑体
```
![](https://github.com/Kongweixie/Image/blob/main/TemplateNKU/TemplateNKU2_001.png?raw=true)
如图左侧为 `\ThemeSongRoman`，右侧为 `\ThemeBlackSans`。

### 6. 插入图片

全局图注（Caption）已统一为非衬线黑体，且通过 `\intextsep` 强制压缩了图片前后的空白间距。
```latex
\begin{figure}
  \centering
  \includegraphics[width=0.55\textwidth]{image/demo.jpg}
  \caption{这是一个示意图}
\end{figure}
```

### 7. 插入脚注

**重大更新**：彻底重写了 `\cornerfootnote{}`。
- 修复了多次调用导致文本堆叠重合的 Bug。现在系统会根据当前 frame 内的注脚数量，自动计算 Y 轴增量并向上抬升排版。
- 修复了跨页污染 Bug。每个新的 `frame` 开始时，计数器会自动清零。

```latex
测试文本一\cornerfootnote{第一条注脚}。
测试文本二\cornerfootnote{第二条注脚（会自动浮动在第一条上方）}。
```

---

## 主文件结构

### 1. 动态封面页

无需手动构建复杂的 TikZ 环境，仅需定义变量并调用单行命令。新版封面引入了胶囊形作者框和底部元素装饰。

  ![示例](https://github.com/Kongweixie/Image/blob/main/TemplateNKU/1.png?raw=true)

```latex
\newcommand{\mytitle}{媒体计算实验室}
\newcommand{\myauthor}{Your Name}

\DrawCoverPage
```

### 2. 自适应目录页

![示例](https://github.com/Kongweixie/Image/blob/main/TemplateNKU/2.png?raw=true)

**新版核心功能**：废弃了原有的 `enumerate` 手动排列。新模板包含两个内置解析引擎，只需传入逗号分隔的字符串，系统会自动统计数量、计算屏幕中心绝对坐标，并完成渲染。

**样式一：色块居中目录 `\DrawTOC`**（适合短标题）

![](https://github.com/Kongweixie/Image/blob/main/TemplateNKU/3.png?raw=true)

```latex
% 传递 [2] 表示高亮第二项，其余项自动置灰弱化
\DrawTOC[2]{项目背景介绍, 核心模块设计, 基础数据测试, 总结与未来计划}
```

**样式二：极简列表目录 `\DrawListTOC`**（适合长标题，支持自动折行缩进）

![](https://github.com/Kongweixie/Image/blob/main/TemplateNKU/4.png?raw=true)

```latex
\DrawListTOC[2]{
  绪论与项目背景分析, 
  基于基础组件的系统核心架构设计, 
  消融实验与主流方案性能对比
}
```

### 3. 核心内容与表格页

![](https://github.com/Kongweixie/Image/blob/main/TemplateNKU/5.png?raw=true)

针对学术表格，使用 `\ThreeLineTable` 宏。该宏会在局部作用域内锁定字号为 `\footnotesize` 并重置列间距，防止表格过大撑破 16:9 画幅。

```latex
\ThreeLineTable{%
  \begin{tabular}{lcccc}
    \toprule
    \textbf{主干网络} & \textbf{参数量} & \textbf{计算量} & \textbf{Top-1 错误率} \\
    \midrule
    基础模型-A & 44.6 M  & 7.8  & 22.63\% \\
    \bottomrule
  \end{tabular}
}
```

### 4\. 图文并排与多图页

主文件中内置了三种学术汇报中最常用的排版范式，涵盖了从单图展示到复杂对比的场景：

**① 单图展示页**
标准的单张结构图/示意图展示，演示了如何控制图片比例并结合 `\cornerfootnote` 规范地添加角注。

![](https://github.com/Kongweixie/Image/blob/main/TemplateNKU/7.png?raw=true)

```latex
\begin{figure}
  \centering
  \includegraphics[width=0.55\textwidth]{image/demo.jpg}
  \caption[这是一个示意图]{这是一个示意图}
\end{figure}
```

**② 双栏对比结构 (左文右图)**
使用 `columns` 环境划分页面。`[T]` 参数确保左右两栏顶部对齐，非常适合左侧撰写分析结论、右侧放置架构图的排版需求。

![](https://github.com/Kongweixie/Image/blob/main/TemplateNKU/8.png?raw=true)

```latex
\begin{columns}[T] % T 代表顶部对齐
  \begin{column}{0.48\textwidth}
    % 左侧文字或列表内容
  \end{column}
  \begin{column}{0.48\textwidth}
    % 右侧图片内容
  \end{column}
\end{columns}
```

**③ 多图并排展示 (消融实验/结果对比)**
采用纯 `minipage` 切割页面宽度（如 `0.31\textwidth` 分三等份），结构更稳固，且每张图可拥有独立的图注。

![](https://github.com/Kongweixie/Image/blob/main/TemplateNKU/9.png?raw=true)

```latex
\begin{figure}
  \centering
  \begin{minipage}{0.31\textwidth}
    \centering
    \includegraphics[width=\textwidth]{image/img1.jpg}
    \caption{Baseline 结果}
  \end{minipage}\hfill
  \begin{minipage}{0.31\textwidth}
    \centering
    \includegraphics[width=\textwidth]{image/img2.jpg}
    \caption{Ours 结果}
  \end{minipage}
  % ... 依此类推
\end{figure}
```



### 5. 算法伪代码页

![](https://github.com/Kongweixie/Image/blob/main/TemplateNKU/10.png?raw=true)

底层集成了 `algorithm2e` 并完成了中文化映射。
**注意**：在 Beamer 中使用 `algorithm` 时，环境必须携带 `[H]` 参数以禁用浮动体机制，否则会导致编译崩溃。
```latex
\begin{frame}[fragile]{核心算法逻辑}
  \begin{algorithm}[H]
    \caption{Mini-Batch Gradient Descent}
    \SetAlgoLined
    % 算法内容...
  \end{algorithm}
\end{frame}
```

### 6. 公式推导展示页

![](https://github.com/Kongweixie/Image/blob/main/TemplateNKU/11.png?raw=true)

结合 `\BehindEqBox` 和 `\underbrace` 等命令，用于构建极具视觉冲击力的大型公式拆解说明。主文件内已提供“年度综合绩效评估模型”的完整 LaTeX 源码。

### 7. 文字强调块

![](https://github.com/Kongweixie/Image/blob/main/TemplateNKU/13.png?raw=true)

底层将 Beamer 原生 block 替换为基于 tcolorbox 的现代化卡片

```latex
\begin{block}{常规信息 (Information Block)}
内容... (紫色主题)
\end{block}

\begin{alertblock}{警告提示 (Warning)}
内容... (红色主题)
\end{alertblock}

\begin{exampleblock}{核心要点 (Key Takeaways)}
内容... (橙色主题)
\end{exampleblock}
```

### 8. 参考文献

![](https://github.com/Kongweixie/Image/blob/main/TemplateNKU/14.png?raw=true)

本模板集成 BibTeX 机制，文献列表已自动适配 lightpurple 主色调。使用时需在根目录准备 references.bib 文件，并在 frame 中调用 \bibliography{references}（严禁带 .bib 后缀）。

为确保排版成功，建议开启 [allowframebreaks] 以支持文献自动跨页，并配合 \footnotesize 优化空间利用。若需显示未引用的条目，请务必在正文中添加 \nocite{*}，否则页面将保持空白。

### 9. 问答页

![](https://github.com/Kongweixie/Image/blob/main/TemplateNKU/15.png?raw=true)

极简的 Q&A 引导页排版。

### 10. 结束页

![](https://github.com/Kongweixie/Image/blob/main/TemplateNKU/16.png?raw=true)

一键生成全屏深紫底色的“致谢”页面，代码极为精简。

```latex
\begin{frame}[plain]
  \begin{tikzpicture}[remember picture,overlay]
    \node[fill=midpurple, opacity=1, minimum width=\paperwidth, minimum height=\paperheight] at (current page.center) {};
    \node[font=\fontsize{40}{70}\selectfont\bfseries, text=white] at (current page.center) {致谢};
  \end{tikzpicture}
\end{frame}
```

---

以下是对 `config.tex` 配置文件部分的详细扩写。这部分主要解释了底层宏定义的逻辑，方便你在不破坏整体排版的前提下进行深度定制。

你可以直接将这部分替换到 README 的对应位置：

---

## 配置文件

本模板的设计核心在于**“内容与样式分离”**。所有的底层排版逻辑、TikZ 绘图封装以及环境重写均在 `config.tex` 中完成。以下是常用的配置项详解：

### 1. 颜色定义

模板抛弃了系统默认的刺眼原色，预设了一套适合长时间观看的低饱和度学术色板。所有颜色均可通过 `\textcolor{颜色名}{文本}` 或在绘图环境中使用。

* **主色调（紫系）：**
    * `lightpurple` (RGB: 134,0,106)：用于页首导航栏背景、强调用色。
    * `midpurple` (RGB: 112,0,95)：模板核心色，用于强调块 (Block) 标题栏、页眉底线、公式背景默认色。
    * `darkpurple` (RGB: 134,0,106)：用于更深层次的视觉分割（如部分背景）。
* **辅色调（功能色）：**
    * `myred` (RGB: 150,50,30)：用于警告 (Alert) 或严重错误信息。
    * `mygreen` (RGB: 45,125,77)：用于积极结果、通过测试或核心要点 (Example) 的强调。
    * `myorange` (RGB: 190,88,32)：用于次级强调或对比实验中的对照组。
    * `myitem` (RGB: 35,35,35)：专用于列表的无序点 (Bullet) 颜色，略浅于纯黑，降低视觉疲劳。

> **修改建议**：若需更改全局主题色，只需在 `config.tex` 中重写 `midpurple` 等 RGB 数值即可，整个模板的图文框和装饰条会自动更新。

### 2. 字体设置

不同操作系统（Windows/macOS/Linux）自带的中文字体差异极大，传统的 `\iftoggle` 绑定写法极易导致“找不到字体”的编译崩溃。本模板对此进行了重构：

**① 底层命令：**
模板封装了三个独立命令，分别控制不同区域的字体：
* `\SetENFont{字体名}`：全局英文字体（同时映射无衬线与等宽字体）。
* `\SetCNFont{字体名}`：全局中文字体（需由 `xeCJK` 支持）。
* `\SetMathFontConfig{字体名}`：全局数学公式字体（需由 `unicode-math` 支持）。

**② 预设主题（开箱即用）：**
在 `config.tex` 中，利用上述底层命令组合了三种常用学术风格。你只需在主文档导言区调用其一即可：
```latex
\ThemeSongRoman    % 传统学术：Times New Roman + Noto Serif CJK SC (思源宋体)
\ThemeBlackSans    % 现代工程：Liberation Sans + Noto Sans CJK SC (思源黑体)
\UseHeiRomanFont   % 混合阅读：Times New Roman + Noto Sans CJK SC (思源黑体)
```
> **自定义字体**：如果你的系统没有思源字体或需要使用特定的商业字体（如方正系列），可以直接在主文档导言区调用 `\SetCNFont{FZHei-B01}` 进行强制覆盖，无需修改底层代码。

### 3. 页脚设置

页脚没有使用 Beamer 僵硬的原生 `\setbeamertemplate{footline}`，而是用 TikZ 的绝对定位功能重绘了三个底端区块，分别占据 30%、60% 和 10% 的页面宽度。

如需修改页脚的作者信息与项目名称，请在 `config.tex` 搜索以下代码块并修改 `node` 中的大括号内容：
```latex
% 左侧区块：作者信息与个人主页 (占据30%宽度，浅紫色)
\node[anchor=center, yshift=0.5pt, font=\tiny, text=white] at (leftblock.center)
     {戴一冕 https://grokcv.site/};

% 中间区块：汇报主题/项目名称 (占据60%宽度，主紫色)
\node[anchor=center, yshift=0.5pt, font=\tiny, text=white] at (midblock.center)
     {大规模图像的多粒度目标检测};

% 右侧区块：动态页码 (占据10%宽度，浅紫色，已设为 \insertframenumber 自动生成，通常无需修改)
```

### 4. 压缩列表样式

Beamer 默认的 `itemize` 在 16:9 画幅下行距过于松散。模板在底层重写了 `\@listi`、`\@listii`、`\@listiii` 的引擎参数，将 `\itemsep` 强制压缩至 `0.4em` 及以下，大幅提升了单页信息密度。

同时，模板暴露了两个列表 Bullet (子弹点) 的全局切换命令：
在主文档 `\begin{document}` 之前，你可以声明：
```latex
\useSmallCircleItem % (推荐) 使用带 80% 透明度的小圆点，更显精致
% 或
\useBigCircleItem   % 使用较大的实心圆点，适合后排观众较多的大型汇报厅
```

### 5. 高级公式背景宏 (`\BehindEqBox`)

为了实现代码的高内聚，模板引入了 `xparse` 和 `pgfkeys` 构建类似于 Python 关键字参数传参的宏。

**底层逻辑：**
当你在正文调用 `\BehindEqBox[color=red, border=2pt]{公式}` 时，底层 TikZ 会在公式（Node）的后方层 (`background layer`) 实时计算公式的包围盒 (`bounding box`)，并根据传入的参数向外扩展计算出圆角矩形的坐标。

**全局修改默认值：**
如果不希望每次调用都手动写参数，可以在 `config.tex` 中搜索 `/BehindEqBox` 的初始化列表进行全局修改：
```latex
\pgfkeys{
  /BehindEqBox/.is family, /BehindEqBox,
  color/.initial = midpurple,   % 全局默认颜色
  border/.initial = 1pt,        % 全局默认线宽
  style/.initial = solid,       % 全局默认样式 (可改为 dashed, dotted)
  padding/.initial = 2.8mm      % 全局默认内边距 (公式与边框的距离)
}
```


### 更新日志   
- 2026-04-11  完成 TemplateNKU 模板
