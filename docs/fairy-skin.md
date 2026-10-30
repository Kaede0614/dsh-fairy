# Fairy 皮肤规格 —— H.D.D. 蓝 × 绝区零街面（0.18.0：删掉输入框上方的状态轨，VOICE 挪到右下角）

> ## 🧿 0.18.0：删掉输入框上面的 H.D.D. 状态轨，VOICE 挪到右下角（用户：「删除会话中，输入框上面这个东西，把【voice】调整到右下角」）
>
> - **状态轨整条删除**（`conversation.input.dock`）：斜切黄条、20 px 小眼、`Fairy` 斜铭牌、
>   `RANDOM PLAY · 录像店二楼`、18 根波形、`REF F-Ⅲ` 全部下线；`WaveMeter`、`.dshf-rail*`、
>   `.dshf-chip`、`.dshf-meta`、`.dshf-wave*`、`@keyframes dshf-wave-k`、`EYE_SIZE.rail` 一起清掉。
> - **唯一保留的是 VOICE**：`VoiceCorner` 仍挂 dock 座位（那里是唯一能拿到实时会话 id 的座位），
>   但用 `react-dom` 的 portal 渲到 `<body>`，`position:fixed; right:14px; bottom:14px;
>   z-index:10050` —— 必须压过总在右下角的鲸鱼娘挂件（9999），否则开关会落进她那个图层，
>   看不见也点不到；portal 同时让 dock 这一行不占高度（会话页 `composerStack` 172 → 128 px）。
> - **角落眼的锚点**从「状态轨顶」改回「卡片顶 − 46 px」：实测同一条线（730），眼睛没动
>   （2234×900 会话页实测 240×240 @ (296,478)）。`HeroQuiet` 找 composer 的判据也只剩输入框。
> - 补一条 `body:has([role="dialog"]) .dshf-voice-corner{opacity:0;pointer-events:none}`：
>   设置面板那种弹窗打开时角落件让位，不浮在弹窗上（宿主弹窗 `z-index:1000`，而角落件为了压过
>   鲸鱼娘挂件必须到 10050）；`:has()` 按宿主自己的 ARIA 角色判断，不吃哈希类名。
>   实测：打开设置 `opacity` 1 → 0、`pointer-events:none`，Esc 关掉后回 1。
> - 实测（1440×900 空白页 / 2234×900 会话页 / 1280×720 空白页）：角上 `elementFromPoint`
>   命中 `button.dshf-btn`，点一下 → `voiceAuto=0`，再点一下 → 开；`[data-slot-error]` = 0。
> - 守卫：`test_client.mjs` 锁「轨的样式不许回来 / VOICE 必须 portal 到 body / 必须钉 14 px」，
>   `test_client_mutations.mjs` 新增三条变异全部变红（portal 拆掉、偏移漂走、轨样式回来）。

> ## 🧿 0.17.0：空白会话页改回对话页版式 + 大眼珠子居中放大（用户：「空白会话页面调整为与非空白
> 会话页面格式一致，区别在于左下角的 fairy 大眼珠子放大并置于屏幕中央」→ 第二轮改为「侧边栏右侧、
> 输入框上方这一片区域的中央，大小 1.5 倍」）
>
> 空白页 66 px 座位删除（`HeroEye` → `HeroQuiet`，仍 `priority:-1`），`HeroQuiet` 不渲眼睛、
> 只按结构把宿主 hero 标题块藏掉；两条 CSS 把 hero 阶段滚动区改底部对齐、把同一块
> `.dshf-corner-plate` 摆到 `--dshf-blank-eye-x/y` 并 `scale(1.5)`（窄窗 1.2）。细节见 README 的 0.17.0 行。

> ## 🧿 0.16.1：删掉两个特效（用户：「fairy 变纯白的特效，和泛出涟漪两个特效删除，其他保留」）
>
> - **变纯白**有两个来源，都处理了：
>   ① 上游每次换表情会放一段两段故障爆闪（`playStateTransition`：2 个横纹脉冲 → 6 个脉冲/其中 2 个横带），
>   亮度 + 对比 + 位移把整只眼推到发白 —— **整段删除**，换表情现在只换眼睑；
>   ② 更隐蔽的那个：5 条 `<use>` 横带克隆会把「白闪圆」（r68.6 的白色圆盘）一起克隆。上游靠
>   `.dsh-fairy-eye-flicker { opacity: 0 }` 压住它，但**这条 CSS 进不到 `<use>` 的 shadow tree**，
>   于是每个克隆各画一张全白圆盘 —— 这才是「fairy 变纯白」的真正来源。
>   修法：白闪圆改成带 `opacity="0"` 的**呈现属性**（会被克隆一起带走），克隆不再画白盘。
>   实测同一帧近白像素 **56.6% → 14%**（`scripts/mascot_white_check.py`，上限 35%）。
> - **泛出涟漪**：睫毛脉冲环整层删除 —— `PULSE_SVG`、`.dsh-fairy-pulse-layer`、
>   `dsh-fairy-lash-pulse{,-slow,-fast}` 三条关键帧、`--dsh-fairy-pulse-cycle` 全部移除。
>   真页面实测 `pulseLayers = 0`、`lash-pulse` 动画 = 0 条。
> - 保留：睫毛 15 s 旋转、四层虹膜同一时钟 0.72 s 错相呼吸、2.3–4.6 s 随机横向撕裂
>   （横纹 / 横带两模式交替）、1.75–3.6 s 白闪、thinking / comforting 两种眼睑、低电量、减动效、
>   可见性 / `pagehide` 冻结。
> - 对照脚本同步：上游页也不再挂脉冲环，并给上游的白闪圆补同一个 `opacity="0"`（否则比的是上游
>   自己的 bug，而不是「其余部分是否一致」）；六个用例仍 **0/255**，另外新增一条故障帧近白守卫。

> ## 🧿 0.16.0：四个座位全部换成 Fairy-DSH 的 mascot（用户：「完全复制 Fairy-DSH 这个项目里的 fairy，
> 包括各种动态动作，替换掉现在的 fairy」）
>
> 1:1 原片那套（三个小座的动画 WebP、0.13.0 的矢量遮罩、0.14.0 的纯 CSS 仿制品）整套删除。
> 现在四个座位（26 / 66 / 20 / 232 px）跑的是 `client/fairy-mascot.port.js`：
> 上游 `fairy-visual/dsh-fairy-visual/src/client/` 下 `mascot-geometry / mascot-eye-svg /
> mascot-effects-svg / mascot-style / mascot-motion-clock / mascot-event-scheduler / mascot-runtime`
> 七个模块的逐条移植（Apache-2.0）。动作：睫毛 15 s/圈、四层虹膜同一时钟 0.72 s 错相呼吸、
> 2.3–4.6 s 随机故障（横纹位移 / 5 条横带错位交替）、1.75–3.6 s 白闪、
> thinking / comforting 两种眼睑、低电量、减动效、页面隐藏冻结。（该版还带着上游的脉冲环与
> 状态切换爆闪，0.16.1 按要求删除。）与上游同帧逐像素差 **0/255**
> （`node scripts/mascot_compare.mjs`，六用例）。`client.js` 1.03 MB → 118 kB。详见 §2.3。

> ## 🧿 0.15.0：左下角只留眼睛（用户：「删除外边框和文字啥的，只保留里面的 fairy 大眼珠子」）
>
> 0.12.0 那块 240×250 的 H.D.D. 面板外形整个拆掉：**边框、径向底色、内外阴影、顶部黄色斜条、
> 底部 34 px 的 `Fairy` 名字条**全部删除，`.dshf-corner-plate` 现在只是一个透明、无边的定位盒
> （`background:none;border:0;box-shadow:none`），里面只有 `FairyMascot`。
> 于是能看到的光全是 SVG 自己的外光晕与四角睫毛——眼睛浮在聊天区背景上。
> 眼睛从 196 px 放大到 **232 px**（原来那圈 12 px 内边距没了），实测盒 240×240 @ (296,482)、
> 底边 722（仍在状态轨上方 8 px），`pointer-events:none`，空白页/窄窗的隐藏规则不变。
> 样张见 §7 的 29 / 31（31 是 3× 放大）。

> ## 🧿 0.14.0：回退到 0.12.0 的画，左下角换成 Fairy-DSH 风格的动态徽记
>
> 用户：「不对，把 fairy 回退到上一个样子，参考【https://github.com/Chengzhibense/Fairy-DSH】
> 这个项目的 fairy 风格，重新制作一个动态的 fairy」。
> - **回退**：0.13.0 那套按原片逐环带量的矢量甜甜圈（`FairyOrb`）整套删除，三个小座位
>   （26 / 66 / 20 px）回到 0.12.0 的**原片动画 WebP**（`scripts/fairy_eye_skin_assets.py --splice`
>   重新生成并内联，0.93 MB）。bundle 回到 0.98 MB。
> - **新的动态 Fairy**：对话区左下角那块 196 px 面板里换成 `FairyMascot` —— 按 Fairy-DSH
>   （Apache-2.0，`fairy-visual`）的画法与动作重写的 SVG：四角睫毛 15 s 转一圈、虹膜四层 0.72 s
>   错相呼吸、睫毛环 4 s 扩散、9 s 一次位移故障、挂载时 210 ms 白闪，说话时全部加速。
>   纯 CSS 动画，没有 JS 时钟。
> - 新样张 [`33-fairy-mascot-phases-014.png`](skin-refs/33-fairy-mascot-phases-014.png)：四个动作阶段的定格；
>   复现命令见 §4（`scripts/preview_mascot.mjs` + `scripts/mascot_phases_sheet.py`）。
> - `test_client.mjs` 现在同时锁定两边：三个小座位必须是内联 webp、左下角必须是 `FairyMascot`
>   且带睫毛/呼吸/光圈/故障四层与对应的 `@keyframes`；变异自检 6 条（含「摘掉睫毛」「让睫毛停转」）全红过。

> ## 🧿 0.13.0：眼睛改回矢量（用户：「你做的 fairy 动画不是矢量的」）
>
> 用户：「我发现你做的 fairy 动画不是矢量的。这样吧，你参考【fairy-eye-1to1】的风格，
> 学习附件中的动画，利用【fairy-mascot-standalone】里的素材重新制作 fairy」。
> 0.10–0.12 的动画是**原片像素**（1:1 素材包 → 动画 WebP 内联，0.93 MB），确实不是矢量。
> 这一版把它整个换成一个 SVG 遮罩 `FairyOrb`：几何与配色按 `scripts/measure_eye_still.py`
> 从 `素材/fairy-eye-1to1/still/plain-idle.png` 逐环带量出来（§2.3 有表），
> 技法（单渐变画外壳、三套 halo stop）借自 `fairy-mascot-standalone`；
> 动作照 1:1 的实测：不眨眼、珠子不动、整体不缩放，只有亮度呼吸 2.41 s / 说话 1.19 s。
> - bundle **0.96 MB → 51 kB**（内联 webp、`EYE_ASSETS`、`--splice` 标记、`prefersStill()` 全部删除；
>   `test_client.mjs` 把 `data:image/webp` 与 `fairy-eye-assets` 列进「不许回来」）。
> - 与 1:1 原片的逐环带差 0.5–21/255，整体 16.2/255（残差是源片扫描线与奶油环外缘那圈四角暗块，
# 左下角徽记的动作定格（四个相位 -> 一张样张）
node scripts/preview_mascot.mjs 400 0.12 idle start   # -> .cache/mascot-preview.html
node scripts/cdp_shot.mjs "file:///…/.cache/mascot-preview.html" .cache\mascot-0.12.png 400 400 800
#   同样渲染 1 / 0.8 pulse / 8.7 glitch 三张，再合成：
engine\.venv\Scripts\python.exe scripts/mascot_phases_sheet.py
> - 四个座位、舞台、状态轨、铭牌都没动，只是眼睛从 <img> 变成 <svg>。

> ## 🧿 0.12.0：位置改了 —— 大眼面板进对话区左下角，贴输入卡片的那块 96 px 板撤掉
>
> 用户截图圈了一块区域（对话区左下、输入卡片上方、贴着侧栏的空白），并说：
> 「我的意思是把 fairy 放到红框所示的地方，对话框左下角这个删除」。
> 所以 0.11.0 那块 96×110 px 的角板**删除**（`.dshf-gutter` 连 CSS 一起删，
> `test_client.mjs` 把它列进「不许回来」），换成一块 **240×250 px 的 H.D.D. 面板**：
> 196 px 眼 + 顶部黄斜条 + 底部 34 px `Fairy` 名字条（12 px 字），
> 贴在**对话区左下角、输入卡片上方 18 px** 处。
> - 定位不是写死的：`conversation.input.left` 里放一个零尺寸的 absolute 锚点，
>   它的 `offsetParent` 就是输入卡片；组件量出卡片的 `rect` 与列的左边界，
>   再用 `position:fixed` 把面板钉在「列左 + 16 px、卡片顶上方 18 px」。
>   卡片的 `ResizeObserver`（多行输入会长高）与窗口 `resize` 都会重算。
> - `pointer-events:none`：整块面板不吃点击，聊天区照常滚动、输入照常打字。
> - **空会话不显示**：空白页已经有一颗 66 px 眼在标题前，两块同时出现等于两个 Fairy。
>   面板在 `HeroEye` 挂载期间隐藏（组件间用模块级计数，不碰 DOM）。
> - 窗口 < 1180 px 或高度 < 620 px 时面板隐藏（再宽就压到消息正文上了）。
> - 真页面实测（1440×900）：面板 242×252 @ (296,470)，底边 722，正好落在状态轨上沿 730 的 8 px 之上
>   （第一版按「卡片顶 − 18」定位，实测底边 754 压住了状态轨左端——它 2 行高 32 px，所以改成以状态轨顶为基准）；
>   会话页可见眼 3 张（26 / 20 / 196 px），空会话面板 `display:none`、可见 3 张（26 / 66 / 20），
>   1024×760 会话页面板同样 `display:none`，`[data-slot-error]` = 0。

> ## 🧿 0.11.0（已被 0.12.0 取代）：贴在输入卡片左下角的小角板
>
> 用户：「在对话框的左下角再加一个大号的 fairy，这样更加有 hdd 的感觉」。
> 96×110 px 板（78 px 眼 + `Fairy` 名字条）用 `position:absolute; left:-98px; bottom:0`
> 挂在输入卡片左下角外侧。**用户随后指出位置不对**（见 0.12.0），这块已删除；
> 留下来的经验是「卡片外侧那 98 px 空白不是用户想放东西的地方」。

> ## 🧿 0.10.1：上下两条「胶片横条」删除（用户裁定）
>
> 用户贴了一张 219×19 的截图（就是那条带方孔的横带）：「最上下方的类似胶片的横条去掉」。
> 已删：`.dshf-strip.is-top` / `.dshf-strip.is-bottom` 两层 + 它们的 CSS，
> 舞台回到 **8 层**；黄色定位角标从避让用的 21 px 收到 12 px。
> `test_client.mjs` 现在把 `dshf-strip` 列进「不许回来」，层数锁 8。
> 其余（半调、蓝辉光、扫描线、暗角、角标、三个眼睛座位、状态轨、铭牌）原样。

> ## 🧿 0.10.0（历史）：大眼珠子第三次回来，这次带 H.D.D. 面板的语境
>
> 用户：「根据 fairy 的人设，参考【素材/fairy-eye-1to1/】中的 fairy 素材，按照参考视频
> 【素材/Fairy视频素材/clips】修改皮肤，要有绝区零的风格」。
>
> 三次教训合起来才是这一版的设计前提：
> 0.8.x 是**画**（测量后矢量重建，用户连判四轮），0.9.0 是**把原片像素浮着放在屏幕上**
> （侧栏 26 / 空白页 132 / 角落 120，用户判「问题很大」），0.9.1 全撤。
> 所以 0.10.0 的做法是：**眼睛只作为「H.D.D. 面板里的那颗眼」出现**——不浮空、不做角落吉祥物、
> 不占用户读字的地方，每个座位都有框（侧栏铭牌底下的 H.D.D. 板、空白页标题前的 H.D.D. 板、
> 输入框上方 H.D.D. 状态轨里的 20 px 小眼）。
>
> 同时按参考录播整层换了画风：半调网点、扫描线、蓝色屏幕辉光、黄色定位角标、
> 斜切标签、压缩字重 + 字距——外加两条胶片齿孔横带，**后者在 0.10.1 被用户否掉，已删**。
> 调色板仍是 H.D.D. 深蓝，黄色（`#FFD52E`）只做「街面警示条」用，
> 不做主题色。
>
> 真页面复核（`node scripts/cdp_auth_shot.mjs`，1440×900，本机 `dsh web` 正在跑）：
> 空会话 `[data-fairy-eye]` = 2（26 px 侧栏 / 66 px 空白页；角板与状态轨是 0.10.1 之后才有的）、`[data-slot-error]` = 0、
> `style[data-plugin=dsh-fairy]` = 1、body 内联 token 108 个；
> `--dsw-alias-bg-base` = `#05070F`、`--dsw-alias-brand-primary` = `#2F6BFF`、
> `--dsw-alias-state-warn-primary` = `#FFD52E`；三张眼图 `complete && naturalWidth > 0`。
> 新会话 / 会话页 / 设置面板 / 1024×700 窄窗各截一张（见 §7 样张）。

## 1. 参考来源

| 来源 | 取到什么 |
|---|---|
| `素材/Fairy视频素材/clips/001_…序章…_3334-3368.mp4` | **契约登场**：右侧 H.D.D. 面板（大圆角、深蓝径向辉光、居中大眼 + 奶油环 + 56° 内球）、面板左下 `Fairy` 名牌、底部长条对话框（近黑、白字、说话人铭牌）、上下黑边带**胶片齿孔** |
| `…/003_…猫的失物（上）_73-122.mp4` | 接管宣言同一套面板；外环球从素环换成齿轮环的过渡 |
| `…/010_…幕间_零号空洞_99-163.mp4` | 检索/申请时的面板常亮状态（呼吸只有亮度变化，尺寸不变） |
| `…/123_…旧梦的安可曲…（3）_2737-2774.mp4` | 第二季的齿轮环近景（尖刺外环 + 冷白奶油环） |
| `…/054_…闪耀的此刻(上)_627-651.mp4` | 游戏内对话视图：斜切黑隔断、说话人小铭牌、右下 UID、右上胶囊控件 |
| **`素材/fairy-eye-1to1/`** | 唯一像素来源：七状态、原生 486–584 px 画布、30 fps（`gear-glitch` 60 fps）、`manifest.json` 与 `sequence/` 逐帧 PNG |
| `scripts/../.cache/ref/ref-*.png` | 上面五段各抽 25 帧的联络表，本轮的肉眼依据（可复现，命令见 §4） |

> 结论一句话：**Fairy 的界面是「蓝色屏幕里的一颗眼 + 底下一条黑条」**，
> 而绝区零整款游戏的界面语言是「黑块、齿孔、半调、压缩字、一条黄」。
> 皮肤就是这两件事叠起来。

## 2. 这一版做了什么

### 2.1 配色

| 用途 | 值 |
|---|---|
| 底 / 侧栏 | `#05070F` / `#04060C` |
| 卡片层 1–4 | `#080D1C` / `#0B1430` / `#101B3C` / `#142147` |
| 描边 1–4 | `#131C36` / `#1B2748` / `#26355C` / `#33457A` |
| 主文字 / 次 / 三 | `#F2F3F5` / `#AEBBD4` / `#7E8FB0` |
| 品牌蓝（logo/链接/焦点） | `#2F6BFF`（hover `#4D82FF`），文字蓝 `#8FD0FF` |
| H.D.D. 青（HUD/状态点/边光） | `#7FD4FF` |
| **警告黄（街面警示条）** | `#FFD52E`（hover `#FFE05C`）——只用于：铭牌小斜条、四角定位标、`VOICE` 开灯、**主按钮填充** |
| 成功 / 错误 | `#4FE3A1` / `#FF5C7A` |
| 圆角 | xs 2 / sm 4 / md 8 / lg 12 / xl 16 / panel 18（原 20，绝区零的框更硬） |
| 字体栈 | `Bahnschrift SemiCondensed` → `Bahnschrift` → `DIN Condensed` → `Segoe UI` → 中文 **HarmonyOS Sans SC**（0.24.7，用户点名「用鸿蒙黑体」）→ 回退 `PingFang SC` → `Microsoft YaHei`；**整个侧边栏**（导航 / 工作区列表 / 页脚 / H.D.D. 小标）中英文统一走 **HarmonyOS Sans SC**（0.24.9），左上角词标例外（内联 Archivo/思源子集，自声明字体） |

对比度：`#F2F3F5` on `#0B1430` ≈ 16:1；`#AEBBD4` on `#05070F` ≈ 9:1；
**黑字 on 黄 `#FFD52E` ≈ 13:1**（主按钮用黄底黑字，这是绝区零的味道，也是它唯一敢用的高饱和色）。

### 2.2 舞台：半调 + 扫描线 + 屏幕辉光（8 层；0.10.1 去掉了胶片齿孔）

`shell.overlay` 里 8 个 `position:fixed; pointer-events:none; z-index:0` 的子层，顺序即叠放顺序：

| # | 类名 | 画法 |
|---|---|---|
| 1 | `.dshf-dots` | 7 px 网格 1 px 青点，`opacity:.10`，径向 mask 只留在底部两角 |
| 2 | `.dshf-bloom` | 右上 58%×42% 蓝辉光（H.D.D. 屏幕打在墙上）+ 左下薄青 |
| 3 | `.dshf-scan` | 1 on / 2 off 扫描线，`opacity:.42`，`mix-blend-mode:multiply` |
| 4 | `.dshf-vig` | 暗角（径向 56% → `rgba(2,4,10,.58)`） |
| 5–8 | `.dshf-mark.is-tl/.tr/.bl/.br` | 15 px 黄色 L 形定位角标（`#FFD52E`，`opacity:.55`，距边 12 px） |

> **0.10.1：上下两条 15 px 胶片齿孔片边（`.dshf-strip`，共 2 层）删除。**
> 用户：「最上下方的类似胶片的横条去掉」。它们占了窗口自己最上、最下各 15 px，
> 又只是纯装饰，所以连 CSS 一起删（`test_client.mjs` 现在把 `dshf-strip` 列为「不许回来」）。
> 剩下的角标原来为了避让条带放在 21 px，现在收到 12 px。

旧的**蓝图网格（32 px 细线 + 每 4 格重线）整套删除**：那是「工程图纸」，不是绝区零。

### 2.3 大眼珠子：Fairy-DSH 本体（0.16.0，0.16.1 去掉两个特效）

用户 2026-10-29（0.16.0）：「目前的 fairy 大眼珠子感觉还是差一些，帮我完全复制
[Fairy-DSH](https://github.com/Chengzhibense/Fairy-DSH) 这个项目里的 fairy，
包括各种动态动作，替换掉现在的 fairy」。

这一版不再「借风格重写」：**上游的 mascot 被逐条移植过来**，四个座位挂同一个实现。

| 上游文件 | 移植后在 `client/fairy-mascot.port.js` 里的内容 |
|---|---|
| `mascot-geometry.js` | 几何常量：外盘 68 / 描边 1.2 / 外光晕 79 / 巩膜 48 / 接触描边 0.8 / 巩膜光晕 56 / 瞳 16 / 右下高光 (98,100.5) r11 + 光晕 18；`formatRatio` 的三位小数字符串（`.868` / `.864` / `.611`） |
| `mascot-eye-svg.js` | 主眼 SVG：三段渐变、扫描线 pattern、`feTurbulence + feColorMatrix + feDisplacementMap` 的横纹故障 filter（`filterRes="96 72"`）、五个横带 clip、两种眼睑 clip（thinking `Q80 90` 下垂 / comforting `Q80 30` 抬起）、五个 `<use>` 克隆 |
| `mascot-effects-svg.js` | 光晕线场（256 条横线折进 4 个亮度桶的 path）+ 脉冲环（5 个同心圆、r52、stroke 20…4.5） |
| `mascot-style.js` | 全部 CSS：招牌、低电量、`data-glitch` 两模式、故障变量、四层呼吸、眼睑、闪烁、`data-visual-suspended`、`prefers-reduced-motion`、所有 `@keyframes` |
| `mascot-motion-clock.js` | 1440 ms 归一化主时钟（`pause` / `resume` / `setRate`） |
| `mascot-event-scheduler.js` | 单任务一次性调度器（flicker / glitch / transition 各一条活回调） |
| `mascot-runtime.js` | 运行时：挂载、节点缓存、`renderMotionFrame` 的缓动反解、四组动作序列、两段过场、可见性与页面生命周期 |

**动作清单（照上游，不是近似）**

| 动作 | 周期 / 触发 | 实现 |
|---|---|---|
| 四角睫毛旋转 | 15 s / 圈 | `.dsh-fairy-corners` rotate；故障锁帧时把当前角度写进 `--dsh-lash-delay` |
| 四层虹膜错相呼吸 | 0.72 s | `sclera .985→.91` / `layer-three 1→.90` / `layer-two 1→.87` / `layer-one 1→.85`，相位 −45 / −90 / −180 ms；**四层共用同一个 1440 ms 时钟逐帧 commit**（`cubic-bezier(.72,0,.28,1)` 反解） |
| 睫毛环脉冲 | ~~`1.44 + 2.56/rate` s~~ | **0.16.1 已删除（用户：泛出涟漪）。** 上游的 `PULSE_SVG` + `.dsh-fairy-pulse-layer` + 三条 `dsh-fairy-lash-pulse*` 关键帧整套移除 |
| 随机故障 | 2.3–4.6 s 后一次，两模式交替 | **横纹**：4 段 30–42 ms 脉冲 + 34–76 ms 淡出，`feDisplacementMap` 只横向位移；**横带**：2–4 段 56–104 ms，5 条横带交替左右错位 1.4–3 px |
| 白闪 | 1.75–3.6 s 后一次，155–255 ms | 半径 68.6 的白色圆 + 四个随机透明度变量；**0.16.1 起该圆带 `opacity="0"` 呈现属性**，否则 5 条 `<use>` 克隆会各画一张白盘（纯白的真正来源） |
| 状态切换 | `setState` 且状态真的变了 | **0.16.1：只换眼睑，不再有故障爆闪**（上游那两段过场是整眼发白的直接来源） |
| thinking 眼睑 | 会话 running | `clip-path` 指向同一条 `Q80 90` 曲线，形状 `translateY(14.5→15.5) scaleY(.55→1)` 随主时钟呼吸 |
| comforting 眼睑 | 上游 comfort 判据命中 | `Q80 30` 浅弧，`translateY(-4→4)` |
| 低电量 | `data-low-power` | 只留必要绘制（CSS 原样） |
| 减动效 / 页面隐藏 | 系统偏好 / `visibilitychange` / `pagehide` | 冻结 CSS 与 JS 时钟；回来后先对齐相位再重新排故障 |

**两个座位（0.18.0）**：侧栏 26 px（`sidebar.brand.mark`，`priority:-1` 顶掉随包鲸鱼）、
对话区左下角 232 px（`conversation.input.left`，零尺寸锚点量出卡片位置后 `fixed` 钉住；
`pointer-events:none`；窗口 < 1180 px / 高 < 620 px 隐藏）。
空白页 66 px 座位在 0.17.0 删掉（`conversation.hero.brand.mark` 改挂 `HeroQuiet`，
只负责藏宿主 hero 标题块，让空白会话落回对话页版式）；输入框上方状态轨那个 20 px 座位
连同整条轨在 0.18.0 删掉，轨里唯一的幸存者 VOICE 开关改成页面右下角的悬浮件（§2.4）。
每个座位一个实例，SVG id 全按实例命名空间化（`fairy-m1-*`、`fairy-m2-*`…），
所以两只眼的 defs、`<use>` 克隆、可变横带矩形互不干扰。

**与上游的差异（写在 `client/fairy-mascot.port.js` 文件头）**

1. id 命名空间化 → 上游在 CSS 里直写 id 的两条规则（横纹 `filter`、两种眼睑 `clip-path`）
   改由实例写成内联声明，渲染色一致；
2. 单例运行时 → `createInstance(root, options)` + 一个共享 `requestAnimationFrame` 循环，
   逐帧提交的内容与上游 `renderMotionFrame()` 一致；
3. `prefers-reduced-motion` 同时停 JS 时钟（上游只停 CSS，JS 提交的呼吸还在；本皮肤按
   「系统要少动就停住」的契约冻结）；
4. 0.16.1 按用户要求删掉两个特效：脉冲环（涟漪）与换表情的故障爆闪（纯白），并把白闪圆的
   `opacity: 0` 从 CSS 改成呈现属性以堵住 `<use>` 克隆的白盘。

**证据**：`node scripts/mascot_compare.mjs` —— 上游模块与移植各渲一页，六个用例
（normal / thinking / comforting / 横纹 / 横带 / 低电量）冻结在同一帧后逐像素比，差 **0/255**；
同一脚本再验运行时（睫毛 CSS 动画在跑、JS 时钟两帧之间确实换了 transform、
`setState` 只换眼睑不再起故障、脉冲环层数 0、眼睑 clip 指向自己的 id、双实例 id 不串、dispose 清空），
并跑一张故障帧测近白像素（`scripts/mascot_white_check.py`，上限 35%，当前 ~15%，删特效前 56%）。
`setState('thinking')` 换态并播故障过场、眼睑 clip 指向自己的 id、双实例 id 不串、dispose 清空）。
原始截图与报告在 `.cache/compare/`。

**素材**：`素材/fairy-mascot-standalone/fairy-mascot.svg` 是早前手写的同款徽记，0.16.0 起不再参与渲染，
只作对照留档。上游源码缓存在 `.cache/Fairy-DSH-src/`（解自 `Fairy-DSH-main.tar.gz`）。

> 座位表就是「用户能容忍眼睛出现在哪儿」的答案：**都在框里，都在边角或标题线上，不压正文**。

### 2.4 侧边栏 / 输入栏

不碰别人的 DOM，只往真实槽位里放东西，布局仍由 shell 决定：

| 槽位 | 内容 |
|---|---|
| `sidebar.brand.mark` | 26 px 眼 + H.D.D. 板 |
| `sidebar.brand.name` | **FAIRY**（13 px / 800 / 字距 .22em）+ 黄色斜切小条 + 小字「Ⅲ型总序式集成泛用人工智能」 |
| `sidebar.footer.action` | **H.D.D. 斜切胶带**：`transform:skewX(-12deg)` + 6 px 青色呼吸点（`dshf-pulse` 2.4 s） |
| `shell.overlay` | 舞台 8 层（§2.2） |
| `conversation.hero.brand.mark` | **`HeroQuiet`**（0.17.0）：不渲眼睛，只按结构把宿主 hero 标题块藏掉 |
| `conversation.input.dock` | **右下角 VOICE 悬浮开关**（0.18.0）：座位本身只用来拿实时会话 id（`VoiceCorner`），渲出来的是 `<body>` 上的 portal —— `position:fixed; right:14px; bottom:14px; z-index:10050`（要压过鲸鱼娘挂件的 9999），dock 这一行不占高度；原先那条 H.D.D. 状态轨（斜切黄条 + 20 px 眼 + `Fairy` 铭牌 + `RANDOM PLAY · 录像店二楼` + 波形 + `REF F-Ⅲ`）整条删除 |
| `conversation.input.left` | **对话区左下角的 232 px 大眼**（0.12.0 定位 / 0.15.0 去框 / 0.16.0 换 Fairy-DSH 本体）：240×240 px 透明定位盒，量出卡片位置后 `fixed` 钉住（§2.3） |
| `conversation.chat.assistant-actions` | 回复操作条里的 **▶ 摘要 / ▶ 全文**（3 px 圆角、字距 .16em 的方角按钮） |

**状态轨为什么曾经在输入框上方，以及它为什么没了。** 0.9.x 把它放在 `conversation.composer.dock`
（卡片下方）。但卡片下方那一条已经被 shell 自己的会话状态条（轮数 / token / 缩放）占着，实测
34 px 的轨落在 y 862–896（900 px 窗口），**正好压住那条状态条**；于是改挂 `conversation.input.dock`。
0.18.0 用户「删除会话中，输入框上面这个东西，把【voice】调整到右下角」→ 整条轨删除，会话页实测
输入卡片上移、`[class*="composerStack"]` 从 172 px 缩到 128 px（2234×900），列里不再多一行；
VOICE 只有 64×25，`elementFromPoint` 在角上命中 `button.dshf-btn`（点一下关、再点一下开）。

**`priority: -1` 仍然是这一节最容易被忽略的一行。** `sidebar.brand.name` / `sidebar.brand.mark` /
`conversation.hero.brand.mark` 都是 `single` 槽位，shell 自己已占 `priority: 0`；再按 0 注册会抛
`single slot "…" already has a registration`，而这个抛错发生在 `slots.inject(...)` 的回调里、被框架吞掉 ——
于是注册看着成功、页面上永远是随包那个 DeepSeek 鲸鱼字标。按 -1 注册才会成为第一个 occupant。

**调色板走 override 而不是 pin。** `theme.register('zzz-hdd')` 出来的 id 不在 `light/dark/system` 里，
`setTheme` 对它不写设置文档，下次启动宿主设置同步会把 `preference` 拉回 `dark`、`active.tokens` 清空。
所以 0.9.0 起额外调 `ctx.theme.overrideTokens('dsh-fairy', { '--dsw-…': { light, dark } })`：
叠在**当前**主题之上，不跟用户的浅色/深色选择打架（代价见 §5）。

VOICE 开关自己带状态点（亮黄 = 自动朗读摘要开着，青 = 关），不绑定任何真实数据，避免出现假数值。

## 3. 接口

| 位置 | 内容 |
|---|---|
| `package.json` | 0.18.0；`dsh.client { platform:'web', immediately:true, inject:[ui-theme, ui-layout] }`、`exports["./client"]`、`files` 含 `assets` |
| `cordis.patch.yml` | `preset-fairy`（人设）+ `dsh-fairy`（启用本包，client 半边才会被 serve） |
| `client/client.js` | `theme.register('zzz-hdd', 107 tokens)` + `theme.overrideTokens('dsh-fairy', 107 对)` + 一张 `<style>`（舞台 / 铭牌 / 胶带 / 右下角 VOICE / 按钮 / `@keyframes dshf-m-*` / reduced-motion）+ 内联 `EYE_ASSETS`（2 状态，0.93 MB，三个小座位）+ 矢量 `FairyMascot`（左下角面板）+ 8 个槽位；**0.98 MB** |
| `assets/fairy-eye/` | 12 个 webp：本轮重新生成的 `plain-idle` / `plain-speak`（动画 + 静帧）+ 0.9.0 留下的另外四状态（未引用，留档） |
| `plugin.preview` | `{ TOKENS, EYE_SIZE, EYE_ASSETS, STAGE_LAYERS, CSS, components: { EyeImage, FairyMascot, SidebarEye, HeroEye, GutterEye, SidebarBrand, SidebarStatus, VoiceCorner, VoiceToggle, VoiceAction, FairyStage } }`，只给样张/测试脚本用（`scripts/preview_mascot.mjs` 就靠它渲样张），运行时无副作用 |

## 4. 自检

```powershell
# 结构：107 tokens / 107 对 override / 8 个舞台子层 / 8 个槽位 / 三处 -1 / 两个眼睛座位都是同一个 FairyEye /
#       无 data:image/webp 与 EYE_ASSETS / 移植块与 client/fairy-mascot.port.js 逐字节一致 /
#       眼睛标记与渐变 id 按实例命名空间 / activity 投影四例 / 面板 pointer-events:none /
#       面板窄窗逃逸（max-width:1180px）/ dshf-strip 与 dshf-gutter 不许回来 / 卸载无残留 /
#       0.18.0：状态轨样式（dshf-rail / dshf-wave / dshf-chip / dshf-meta）不许回来、
#              VOICE 必须 portal 到 <body>、必须钉在 right/bottom 14 px、弹窗打开时让位
node scripts/test_client.mjs
node scripts/test_client_mutations.mjs   # 十六条回归必须让它变红（含「摘掉睫毛」「让睫毛停转」「移植块漂移」
                                          # 与 0.18.0 新增的「portal 拆掉」「角上偏移漂走」「删掉的轨样式回来」
                                          # 「弹窗让位规则失效」）

# 外观（0.16.0/0.16.1 的核心证据）：上游 mascot 与移植同帧逐像素对照 + 运行时校验
node scripts/mascot_compare.mjs
#   → 六个用例（normal / thinking / comforting / 横纹 / 横带 / 低电量）差 0/255

# 真页面（要 dsh web 正在跑）：现签会话 cookie 后截真 GUI
node scripts/cdp_auth_shot.mjs "http://127.0.0.1:3080" .cache\fairy-live.png 1440 900 9000
# 会话页（点开侧栏第一条会话再截）：
node scripts/cdp_auth_shot.mjs "http://127.0.0.1:3080" .cache\fairy-chat.png 1440 900 9000 `
  --eval-file .cache\open-session-y.js --settle 1200

# 参考录播抽帧（§1 的联络表就是这么来的）
ffmpeg -hide_banner -loglevel error -y -i "素材\Fairy视频素材\clips\001_….mp4" `
  -vf "fps=1,scale=384:-1,tile=5x5" -frames:v 1 .cache\ref\ref-001.png
```

`scripts/cdp_auth_shot.mjs` 读 `~/.dsh/.credentials.yaml` 里的 `client-connection/browser-session` 密钥，
按 `dsh web` 的 cookie 格式（`v1.<body>.<hmac>`）现签一枚 30 天有效的 cookie，再通过 CDP 的
`Network.setCookie` 塞进 headless Chrome；只做「打开页面 / 可选点击 / 截图」，不写服务端状态。

**本轮真页面实测数据（1440×900）**

| 页面 | 取证 |
|---|---|
| 新会话（草稿态，0.18.0 实测 1440×900） | 2 个 mascot 实例（`fairy-m1..m2`）；可见眼 **26 px**（侧栏）+ 空白页那颗 232 px 放大 1.5 倍（实测 360×360 @ (680,197)）；右下角 `.dshf-voice-corner` 64×25 @ (1362,861)，`elementFromPoint` 命中 `button.dshf-btn`；`[data-slot-error]` = 0 |
| 会话页（0.18.0 实测 2234×900） | **2 个实例、2 张眼：26 / 232 px**；大面板 240×240 @ (296,478)、底边 718 = 卡片顶上方 54 px（原状态轨的位置），`pointer-events` = `none`；输入框上方不再有状态轨，`[class*="composerStack"]` 128 px（原 172 px）；`.dshf-fairy-corners` 的 `animation-name` = `dsh-fairy-lashes`；JS 时钟两帧之间 sclera transform 从 `scale(0.9849…)` 变到 `scale(0.9833…)`；右下角 VOICE 64×25 @ (2156,861)，点一下 → `voiceAuto=0`、再点一下 → 开；`[data-slot-error]` = 0 |
| 设置面板 | 深蓝卡片 + 白色选中框 + 蓝开关，正文可读（`#F2F3F5` on `#0B1430`） |
| 1280×720（空白页，0.18.0） | 右下角 VOICE 64×25 @ (1202,681)、`elementFromPoint` 命中自身；不压发送键（卡片右缘 1132）；**大面板 `display:none`**（媒体查询 `max-width:1180px`，实测） |

## 5. 已知限制

- **主题走 override 层**：它把 H.D.D. 的深色值同时用于 light/dark 两种配色，所以用户在外观里切「浅色」时
  页面仍是深色皮肤（`color-scheme` 会是 light，但色板被盖住）。这是皮肤的取舍；真要不打架就得给每个
  token 写两套值。
- **两处画风统一（0.18.0）**：0.16.0 起每个座位都是 Fairy-DSH 的同一只眼（之前是「原片 + 仿制徽记」两套），
  差别只剩尺寸：26 / 232 px 盒子（输入框上方那颗 20 px 与空白页 66 px 分别在 0.18.0 / 0.17.0 删除）。
- **bundle 118 kB**：0.16.0 删掉了 0.93 MB 内联动画 WebP，眼睛是纯矢量 + 一份 CSS。
- **表情只有三种**：`normal` / `thinking`（会话 running）/ `comforting`（上游 comfort 判据命中）。
  上游另有 `low-power` 这一档，本皮肤没有电量档位，规则保留但没人置位。
- **`data-state` 的触发源是会话快照**：`ctx.sessions` 是 shell 的客户端服务；取不到行或快照过期时
  一律退回 `normal`（不猜表情）。语音在说话时也会临时用 `thinking` 睑，避免朗读期间成死眼。
- **`VOICE` 黄灯（0.18.0：页面右下角）**：语音总开关关闭时按钮退回青灰、黄点熄灭；
  它压在鲸鱼娘挂件（`z-index:9999`）之上（`10050`），否则角上根本看不见也点不到。
- **reduced-motion**：`@media (prefers-reduced-motion: reduce)` 关掉所有 CSS 动画，运行时同时冻结
  JS 时钟与故障调度，眼睛停在当前相位——这是本皮肤对上游的一处有意偏离（上游只停 CSS，
  JS 提交的呼吸还在）。真机上 `prefers-reduced-motion` 命中时**眼睛是静止的**，这是预期行为。
- **随机故障帧已取证**：`scripts/mascot_compare.mjs` 会自己驱动一张横带故障帧并用
  `scripts/mascot_white_check.py` 卡近白比例（当前 ~15%，上限 35%）；0.16.1 在真 GUI 上也用同法
  触发过一次（`.cache/live-fault-0161-corner.png`，近白 12.6%）——那时看到的是**被切开的蓝眼**，不是白盘。
  随机白闪（1.75–3.6 s）仍未在真 GUI 目视，只由运行时校验与静态对照锁住。
- **鲸鱼挂件与右下角 VOICE 抢同一个角**：`dsh-whale-widget` 的鲸鱼娘默认固定在窗口右下角
  （250×250，`z-index:9999`，可拖动），0.18.0 的 VOICE 就贴在她那张脸上（`10050`，压在挂件之上）。
  用户已确认会删掉挂件；挂件还在时想看清她就得把她拖走——两者都不是本插件的内容/行为。
- **大面板只在够宽/够高的窗口出现**：`@media (max-width:1180px), (max-height:620px)` 隐藏。
  再窄，240 px 的面板就直接压在消息正文上了。
- **大眼珠子会盖住对话区左下角那一块**：它 `pointer-events:none`、不挡点击，但视觉上会盖住
  240×240 px 的区域——消息正文靠近底部、或状态行很长时会被挡一截。这是用户点名要的位置，
  所以没有做自动避让；不想要的时候把 `client.js` 里 `conversation.input.left` 那一行删掉即可。
- **`assets/fairy-eye/` 整套现在是死文件**（0.10–0.15 的原片动画 WebP，0.16.0 起不再引用），
  按仓库规矩不删；`client.js` 里已经没有它们的引用。

## 6. 历史（为什么会有这一版）

- **0.9.1（上一版，眼睛第二次被删）**：用户「删除这个大眼珠子，问题很大」，并选择三个座位一起撤。
  0.9.0 的六状态播放器、`eyeStore`、拖拽缩放单击、1.41 MB 内联素材全移除，`client.js` 回到 31 kB；
  **保留** 0.9.0 顺手修的两处非眼睛问题：`single` 槽位 `priority:-1`（铭牌此前十个版本没显示）、
  调色板改走 `theme.overrideTokens`。本版继续沿用这两条。
- **0.9.0（眼睛第一次用原片像素）**：`素材/fairy-eye-1to1` 六状态 → 192 px / 15 fps 动画 WebP 内联；
  三个座位 26 / 132 / 120，可拖、滚轮缩放、单击爆亮。判定「问题很大」。
- **0.8.0–0.8.5（画眼睛的时代）**：178 段录播、41211 帧测量 → 三层同心环 + 钉死的内球；
  0.8.3 起照 `fairy-mascot-standalone/fairy-mascot.svg` 逐数值重建，加两种撕裂（`slice` / `roll`）
  与四角旋转；与素材包逐像素平均差 1.6–3.8/255，用户仍判「效果还是差一点」。
- **0.8.6**：整套删除。
- 取数与重放脚本仍在：`scripts/vid_orb_*.py`、`scripts/fairy_eye_model.py`、`scripts/fairy_eye_profile.py`、
  `scripts/fairy_eye_native_analyze.py`、`scripts/fairy_eye_restore_090.py`、`client/client.js.bak-*-eye090`。

## 7. 样张

本轮（0.16.1 重新截过，真 GUI）：
- [`34-fairy-dsh-mascot-016-hero.png`](skin-refs/34-fairy-dsh-mascot-016-hero.png)：空会话 —— 侧栏 26 px 眼 +
  黄色斜条铭牌 + 空白页 66 px 眼 + H.D.D. 状态轨（左下角那颗此时隐藏）+ 半调/辉光/黄角标；
- [`35-fairy-dsh-mascot-016-chat.png`](skin-refs/35-fairy-dsh-mascot-016-chat.png)：会话页 ——
  左下角 232 px 的 Fairy-DSH 本体（睫毛四角 / 巩膜光晕 / 三层虹膜 / 瞳孔 / 右下高光 / 扫描线），
  侧栏 26 px 与状态轨 20 px 两只是同一个实现的另外两个尺寸；**画面里已经没有脉冲环**；
- [`36-fairy-dsh-parity-016.png`](skin-refs/36-fairy-dsh-parity-016.png)：**核心证据** ——
  左 = Fairy-DSH 上游模块渲的，中 = 本仓库移植渲的，右 = 逐像素差（全黑 = 0）。
  六格依次是 normal / thinking / comforting / 横纹故障 / 横带故障 / 低电量；
  上游页同样不挂脉冲环、白闪圆补同一 `opacity="0"`，比的是「删掉这两个特效之后其余部分是否一致」；
- 0.15.0 及更早的样张（28 / 29 / 30 / 31 / 32 / 33）保留作历史对照：它们的眼睛不是现在这只。

历史：
- 0.9.1 撤眼之后：[`27-fairy-noeye-091.png`](skin-refs/27-fairy-noeye-091.png)；
- 0.9.0 三个座位：[`25-fairy-eye-live-090.png`](skin-refs/25-fairy-eye-live-090.png)、
  [`26-fairy-mascot-live-090.png`](skin-refs/26-fairy-mascot-live-090.png)、
  [`24-fairy-eye-states-090.png`](skin-refs/24-fairy-eye-states-090.png)（六状态 × 起中末三帧 + 三座位尺寸）；
- 0.8.x 重画期：[`21-fairy-orb-preview-085.png`](skin-refs/21-fairy-orb-preview-085.png)、
  [`22-fairy-orb-motion-085.png`](skin-refs/22-fairy-orb-motion-085.png)、
  [`23-fairy-orb-diff-085.png`](skin-refs/23-fairy-orb-diff-085.png)、
  [`18-fairy-orb-preview-084.png`](skin-refs/18-fairy-orb-preview-084.png)、
  [`19-fairy-orb-diff-084.png`](skin-refs/19-fairy-orb-diff-084.png)、
  [`15-fairy-orb-asset-083.png`](skin-refs/15-fairy-orb-asset-083.png)、
  [`13-fairy-orb-compare-081.png`](skin-refs/13-fairy-orb-compare-081.png)；
- 游戏参考：[`10-game-dialogue-box.png`](skin-refs/10-game-dialogue-box.png)。
