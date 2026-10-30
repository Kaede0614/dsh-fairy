# 开发日志（DEVLOG）

> 这是皮肤的开发日志原稿：每一版改了什么、为什么改、用哪张图验的。
> 面向用户的安装与配置见 [README](../README.md)，设计规格见 [fairy-skin.md](fairy-skin.md)。

把 DeepSeek Harness 的编码代理换成《绝区零》里那个 **Ⅲ型总序式集成泛用人工智能**：
汇报用协议词、对人礼貌但嘴上有刀、自夸到具体、偶尔伪故障。

> **0.16.1：删掉两个特效（用户：「fairy 变纯白的特效，和泛出涟漪两个特效删除，其他保留」）。**
> - **变纯白**有两个来源，都删了：① 每次换表情（会话 running / 说话）上游会放一段**两段故障爆闪**
>   `playStateTransition`，整只眼瞬间被亮度/对比+位移推到发白——整段删除，换表情现在只换眼睑；
>   ② 5 条 `<use>` 横带克隆把「白闪圆」也克隆了：上游靠 CSS `opacity:0` 压住它，而那条规则
>   **进不到 `<use>` 的 shadow tree**，于是每个克隆各画一张全白圆盘——这正是纯白的真正来源。
>   修法：白闪圆改成带 `opacity="0"` 的**呈现属性**（会被克隆一起带走），克隆不再画白盘；
>   实测同一帧的近白像素从 **56.6% → 14%**（`scripts/mascot_white_check.py`，上限 35%）。
> - **泛出涟漪**：睫毛脉冲环整层删除（`PULSE_SVG`、`.dsh-fairy-pulse-layer`、三条
>   `dsh-fairy-lash-pulse*` 关键帧、`--dsh-fairy-pulse-cycle` 全部移除），本插件不再有那圈扩散的光环。
> - 保留：睫毛 15 s 旋转 · 四层虹膜同一时钟错相呼吸 · 2.3–4.6 s 随机横向撕裂（横纹 / 横带两模式）·
>   1.75–3.6 s 白闪 · thinking / comforting 眼睑 · 低电量 · 减动效 · 可见性冻结。
> - 对账脚本同步更新：上游页也不再挂脉冲环，并给上游的白闪圆补同一 `opacity="0"`（否则比的是上游
>   自己的 bug，而不是「其余部分是否一致」）；六个用例仍 **0/255**，另加一条「故障帧不得大面积纯白」的守卫。
>
> **0.16.0：整套换成 Fairy-DSH 的 fairy（用户：「目前的 fairy 大眼珠子感觉还是差一些，帮我完全复制
> 【https://github.com/Chengzhibense/Fairy-DSH】这个项目里的 fairy，包括各种动态动作，替换掉现在的 fairy」）。**
> 1:1 原片那套（三个小座的动画 WebP、0.13.0 的矢量遮罩、0.14.0 的纯 CSS 仿制品）整套删掉，
> 换成 **Fairy-DSH（Apache-2.0）自己的 mascot**：`client/fairy-mascot.port.js` 是它
> `mascot-geometry / mascot-eye-svg / mascot-effects-svg / mascot-style / mascot-motion-clock /
> mascot-event-scheduler / mascot-runtime` 七个模块的逐条移植（几何、渐变、光晕线场、
> 全部 CSS 与关键帧、单一时钟的移植），四个座位（26 / 66 / 20 / 232 px）各挂一个实例。
> 动作：睫毛 15 s/圈 · 四层虹膜按同一时钟 0.72 s 错相呼吸 · 2.3–4.6 s 随机故障
> （横纹位移 / 5 条横带错位，两模式交替，30–104 ms 短脉冲）· 1.75–3.6 s 白闪 ·
> thinking / comforting 两种眼睑（上游的 comfort 判据逐条照搬；会话 running → thinking）·
> 低电量规则 · `prefers-reduced-motion` 同时停 CSS 与 JS 时钟 ·
> 页面隐藏 / `pagehide` 冻结、回来自动对齐相位 · 卸载即清空与注销。
> （该版还带着上游的脉冲环与状态切换爆闪，0.16.1 按要求删除。）
> 证据：`node scripts/mascot_compare.mjs` 把**上游模块**和**本仓库的移植**渲进同一帧对比
> （normal / thinking / comforting / 横纹故障 / 横带故障 / 低电量 六个用例），逐像素差 **0/255**，
> 同一脚本再验运行时（DOM、CSS 动画、JS 时钟真的在推进、`setState` 切换、双实例 id 不串、销毁无残留）。
> `client.js` 1.03 MB → 118 kB。
>
> **0.15.0：左下角只留眼睛（用户：「删除外边框和文字啥的，只保留里面的 fairy 大眼珠子」）。**
> 0.12.0 那块 240×250 H.D.D. 面板的外形整套拆掉：边框、径向底色、内外阴影、顶部黄斜条、
> 底部 `Fairy` 名字条全删；`.dshf-corner-plate` 只剩一个透明无边的定位盒，里面只有 `FairyMascot`。
> 眼睛从 196 px 放大到 **232 px**（原先那圈 12 px 内边距没了）。实测 240×240 @ (296,482)、
> 底边 722（状态轨上方 8 px）、`pointer-events:none`；空白页 / 窄窗隐藏规则不变。
> 动画照旧：睫毛 15 s/圈、虹膜 0.72 s 四层错相、光圈 4 s、故障 9 s、挂载白闪。

> **0.14.0：回退到 0.12.0 的画，左下角换成 Fairy-DSH 风格的动态徽记。**
> 用户：「不对，把 fairy 回退到上一个样子，参考【https://github.com/Chengzhibense/Fairy-DSH】
> 这个项目的 fairy 风格，重新制作一个动态的 fairy」。
> - **回退**：0.13.0 的矢量甜甜圈（`FairyOrb`）整套删除，三个小座位（26 / 66 / 20 px）回到 0.12.0 的
>   原片动画 WebP（`scripts/fairy_eye_skin_assets.py --splice` 重新生成内联，0.93 MB）。
>   0.13.0 的成品快照留在 `.cache/client-before-014.js`。
> - **新的动态 Fairy**：左下角 196 px 面板里换成 `FairyMascot` —— 按 Fairy-DSH（Apache-2.0，
>   `fairy-visual`）的画法与动作重写：四角睫毛 15 s 转一圈、虹膜四层 0.72 s 错相呼吸、
>   睫毛环 4 s 扩散、9 s 一次位移故障、挂载 210 ms 白闪，说话时全部加速。纯 CSS，无 JS 时钟。
> - 样张 [`33-fairy-mascot-phases-014.png`](skin-refs/33-fairy-mascot-phases-014.png)；
>   `test_client.mjs` 同时锁两边（三个小座位 = 内联 webp，左下角 = `FairyMascot` + 四层动作 + keyframes）。

> **0.13.0：眼睛改回矢量（用户：「你做的 fairy 动画不是矢量的」）。**
> 0.10–0.12 的动画是原片像素（1:1 素材包 → 动画 WebP 内联，0.93 MB）。这次换成 SVG 遮罩
> `FairyOrb`：几何与配色用 `scripts/measure_eye_still.py` 从
> `素材/fairy-eye-1to1/still/plain-idle.png` 逐环带量出来（奶油环 R=126.9 px、内盘 0.55 R、
> 结构外缘 186、羽化到 217、珠子 r 0.17 R 在 0.31 R 轨道 +56°），技法（单渐变画外壳、halo stop）
> 借自 `fairy-mascot-standalone`；动作照 1:1 实测：不眨眼、珠子不动、整体不缩放，
> 只有亮度呼吸 **2.41 s / 说话 1.19 s**。
> - bundle **0.96 MB → 51 kB**；`EYE_ASSETS` / 内联 webp / `--splice` 标记 / `prefersStill()` 全部删除，
>   `test_client.mjs` 把 `data:image/webp`、`fairy-eye-assets`、`EYE_ASSETS` 列为「不许回来」
>   （变异自检新增「塞回栅格眼睛」「摘掉珠子」两条）。
> - 与 1:1 原片逐环带差 0.5–21/255、整体 16.2/255；残差是源片的扫描线与奶油环外缘那圈四角暗块，
>   两者都没有复刻。复算：`scripts/preview_orb.mjs` + `scripts/cdp_shot.mjs` + `scripts/compare_orb.py`。
> - 四个座位（26 / 66 / 20 / 196 px）、舞台、状态轨、铭牌都没动。

> **0.12.0：位置改了 —— 大眼面板搬进对话区左下角（用户划框指定），0.11.0 那块贴卡片的小板删除。**
> 用户截图圈出「对话区左下、输入卡片上方、贴着侧栏」的空白并说：「我的意思是把 fairy 放到红框所示的地方，
> 对话框左下角这个删除」。所以 96×110 px 的角板连 CSS 一起删（`.dshf-gutter` 进「不许回来」列表），
> 换成 **240×250 px 的 H.D.D. 面板**（196 px 眼 + 顶部黄斜条 + 底部 34 px `Fairy` 名字条）。
> - 定位：`conversation.input.left` 里零尺寸 absolute 锚点 → `offsetParent` 就是输入卡片 →
>   量出卡片 `rect` 与列左边界 → `position:fixed` 钉在「列左 + 16 px、卡片顶上方 18 px」；
>   卡片的 `ResizeObserver`（多行输入会长高）与窗口 `resize` 都重算。`pointer-events:none`，不吃点击。
> - **同一时刻只有一个 Fairy**：空白页的 hero 眼在的时候面板隐藏（模块级计数，不读 DOM）；
>   窗口 < 1180 px 或高 < 620 px 时也隐藏（再窄就压到正文上了）。
> - 真页面实测（1440×900）：面板 **242×252 @ (296,470)**，底边 722（状态轨上沿 730 上方 8 px，状态轨左端完整可见）；
>   会话页可见眼 3 张（26 / 20 / 196 px）；空会话面板 `display:none`、可见 3 张（26 / 66 / 20）；
>   1024×760 会话页面板同样 `display:none`；`[data-slot-error]` = 0。样张
>   [`29-fairy-zzz-chat-010.png`](skin-refs/29-fairy-zzz-chat-010.png)。

> **0.11.0（已被 0.12.0 取代）：贴在输入卡片左下角的小角板。**
> 96×110 px 板（78 px 眼 + `Fairy` 名字条）用 `position:absolute; left:-98px; bottom:0` 挂在卡片左下角外侧；
> 用户随后指出位置不对，这块已删除。

> **0.10.1：上下两条「胶片横条」删除（用户裁定）。**
> 用户贴出那条带方孔的横带截图：「最上下方的类似胶片的横条去掉」。
> 删的是 `.dshf-strip.is-top` / `.dshf-strip.is-bottom` 两层与它们的 CSS，舞台 **10 → 8 层**；
> 黄色定位角标从避让条带的 21 px 收到 12 px；其余（半调、蓝辉光、扫描线、暗角、角标、
> 三个眼睛座位、状态轨、铭牌）原样。`scripts/test_client.mjs` 现在把 `dshf-strip`
> 列进「不许回来」，层数锁 8。真页面复核：1440×900 空会话窗口最上/最下已无黑边，
> `[data-slot-error]` = 0（当时眼图 2 张：26 / 66 px；0.11.0 起是 4 张）。

> **0.10.0：大眼珠子第三次回来，带 H.D.D. 面板的语境；整层换成绝区零街面画风。**
> 用户：「根据 fairy 的人设，参考【素材/fairy-eye-1to1/】中的 fairy 素材，按照参考视频
> 【素材/Fairy视频素材/clips】修改皮肤，要有绝区零的风格」。
> 三次教训合成这一版的前提：0.8.x 是**画**（矢量重建，判四轮不行），0.9.0 是**把原片像素浮着放**
> （侧栏/空白页/角落三座位，判「问题很大」），0.9.1 全撤。所以这次眼睛**只作为「H.D.D. 面板里的那颗眼」**
> 出现——三个座位全带框、不浮空、不压正文。
> - **素材**：`素材/fairy-eye-1to1` 的原片像素（无重绘），`scripts/fairy_eye_skin_assets.py
>   --box 200 --fps 30 --quality 78 --states plain-idle,plain-speak --splice` 生成
>   **479 KB / 234 KB** 两段循环动画 WebP，连静帧一起内联进单文件 bundle（`client.js` 31 kB → **0.96 MB**）。
> - **三个座位**：侧栏 `sidebar.brand.mark` 26 px、空白页标题前 `conversation.hero.brand.mark` 66 px、
>   输入框上方状态轨里 20 px；语音播放中切 `plain-speak`，`prefers-reduced-motion` 时只显示静帧。
> - **画风**：删掉蓝图网格，换成半调网点 + 扫描线 + H.D.D. 蓝辉光 + 暗角 +
>   黄色 L 定位角标（当时还有两条胶片齿孔横带，**0.10.1 被用户否掉，已删**）；铭牌加黄色斜切小条、脚部改斜切 H.D.D. 胶带、输入框上方一条 H.D.D. 状态轨
>   （斜切黄条 + 眼睛 + `Fairy` 斜铭牌 + 波形 + `VOICE` + `REF F-Ⅲ`）；黄色 `#FFD52E` 只做警示条与主按钮。
> - **一处布局教训**：状态轨原本挂 `conversation.composer.dock`（卡片下方），实测 34 px 的轨落在
>   y 862–896（900 px 窗口）**正好压住 shell 自己的会话状态条**；改挂 `conversation.input.dock`（卡片上方）后
>   会话页实测 1153×32 @ y=730，不重叠。
> - 真页面复核：空会话 `[data-fairy-eye]` = 2（26/66 px）、`[data-slot-error]` = 0、body 108 个内联 token、
>   `--dsw-alias-bg-base` = `#05070F`、三张眼图 `naturalWidth > 0`。样张
>   [`28-fairy-zzz-empty-010.png`](skin-refs/28-fairy-zzz-empty-010.png)、
>   [`29-fairy-zzz-chat-010.png`](skin-refs/29-fairy-zzz-chat-010.png)。
>   规格与限制见 [`docs/fairy-skin.md`](fairy-skin.md)。

> **只回退了 0.3.2 那一步（2026-10-28，v0.4.1）。** 用户判定「游戏对话框式输入框 + 调蓝 + 去网格」
> 这一步不行，只撤销这一步：输入框恢复随包的卡片样式、底色回到 `#060915`、蓝图网格恢复。
> **0.3.0/0.3.1 的东西全部保留**：`zzz-hdd` 主题、空白会话大眼交接、侧栏 `FAIRY` 铭牌与 H.D.D. 药丸、
> 输入栏状态轨。**大眼珠子在 0.8.0 重做了**：换成素材包实测的三层同心环，旧版那套「眨眼/虹膜追视」
> 的行为（0.3.0 引入）已被删除 —— 实测 41211 帧里游戏的眼睛从不眨眼、内球不动。
> `dsh-fairy` 行保持启用。
>
> **0.8.1 只重画了大眼珠子。** 用户判定 0.8.0 那颗「效果还是差一点」，所以按用户自己的 1080p
> 参考片段（`044_…火狱骑行（下）`，252 帧）重新量了环带半径与逐带配色（奶油环 0.72–0.97 R、
> 细亮圈 0.565 R、外缘亮环 1.60 R、深蓝盘 1.55 R、光晕到 2.05 R），补上 0.8.0 缺的外缘亮环、
> 淡蓝带、青色细圈与内球光晕，默认季改成参考片段里的**素环**。皮肤 / 输入框 / 布局 / 槽位一行未动。
> 上一版（一次整屏重做尝试，当时也想叫 0.9.0 但被否）留在 `.cache/v2/client-0.9.0-attempt.js.wip`，
> 与现在这个 0.9.0 无关。

> **0.9.1：大眼珠子整套删除（第二次）。** 用户：「删除这个大眼珠子，问题很大」，并选择三个座位一起撤。
> 0.9.0 那套原片像素的眼睛（侧栏 26 px / 空白页 132 px / 角落 120 px 吉祥物、六状态播放器、
> `eyeStore`、拖拽缩放单击、`fairy-eye-assets` 内联块 1.41 MB）**全部移除**；
> 舞台回到 7 层（3 装饰 + 4 角标）、槽位回到 5 个，`client.js` 从 1.44 MB 回到 **31 kB**。
> 生成的 webp 与生成脚本**没有删**（`assets/fairy-eye/`、`scripts/fairy_eye_skin_assets.py`、
> `scripts/preview_eye_states.py`），0.9.0 的客户端实现留在
> `client/client.js.bak-*-eye090` 与 `scripts/fairy_eye_restore_090.py` —— 以后想再试一次，
> 一条命令就能装回来。
> **留下来的仍是 0.9.0 顺手修的两处（与眼睛无关）**：侧栏 `FAIRY` 铭牌现在真的盖住随包品牌
> （`priority: -1`），调色板走 `theme.overrideTokens` 顶住宿主设置同步；`#060915` 底、品牌蓝、
> 蓝图网格、H.D.D. 药丸、输入栏状态轨、语音全部照旧。
> 真页面复核（`scripts/cdp_auth_shot.mjs`）：`[data-fairy-eye]` = **0**、`[data-fairy-mascot]` = **0**、
> 铭牌仍是 `FAIRY …`、`--dsw-alias-bg-base` = `#060915`、body 上 108 个内联 token、无 `data-slot-error`。

> **0.9.0：大眼珠子回来了 —— 这次是原片像素，不是重画（已被 0.9.1 撤掉）。**
> 用户：「根据刚才做的fairy素材【素材/fairy-eye-1to1/】，在皮肤中加入fairy」。
> 六个实测状态（`plain-idle` 呼吸 / `plain-speak` 聆听 / `plain-wake` 进场 / `plain-fade` 退场 /
> `plain-glow` 过亮 / `gear-glitch` 齿轮环失步）从 `素材/fairy-eye-1to1/sequence/` 逐帧重采样成
> **192 px · 15 fps · 带透明白通道的动画 WebP**（`scripts/fairy_eye_skin_assets.py`：按各自实测
> `outerRadius × 1.04` 裁到结构外缘，帧率 30→15 只做整数抽帧并同时改帧间隔，播放速度不变；
> 六个状态连静帧一共 1.0 MB）。素材以 **data URI 内联**进 `client/client.js`：client bundle 是
> 单文件、没有打包器，取不到包内 `assets/`，内联块夹在 `>>> fairy-eye-assets` 标记之间，
> 重跑脚本加 `--splice` 只会替换这一段。
> 三个座位：**侧栏 26 px 标识**（顶掉随包的 DeepSeek 图标）、**空白页 132 px 大眼**
> （`conversation.hero.brand.mark`）、**角落 120 px 吉祥物**（`shell.overlay`：拖动换位置、
> 滚轮 96–240 px、单击亮一下、双击归位）。状态映射：agent 在跑 → `plain-speak`；
> 出错 / 连接重同步 → `gear-glitch` 0.35 s；单击 → `plain-glow` 3 s；空白页大眼出现时角落眼走
> `plain-fade` 退场、交班回来走 `plain-wake` 进场。0.8.4–0.8.5 那套矢量画法（环带、四角旋转、
> 两种撕裂配方、撕裂时钟）整段删除。
>
> **顺手修了两处「皮肤不显示」的老伤（并把它们锁进测试）**：
> ① `single` 槽位（`sidebar.brand.mark` / `sidebar.brand.name` / `conversation.hero.brand.mark`）
> 在 shell 自己已占用时会**同优先级注册抛错**，而抛错被 `slots.inject` 吞掉 —— 所以 0.3.x 以来
> 的 `FAIRY` 铭牌一直是死的（真页面里一直是 deepseek HARNESS 那个 svg）；现在注册到
> `priority: -1` 才真的盖住。
> ② 主题 pin 活不过一次启动：注册出来的 theme id 不会被持久化，宿主设置同步把 `preference` 拉回
> `dark`，皮肤只剩网格、没有调色；现在多挂一层 `theme.overrideTokens('dsh-fairy', { light, dark })`，
> 它是叠在当前主题上的图层，不跟用户的浅色/深色选择打架。
> ③ 两条都锁进 `scripts/test_client.mjs`：三个 single 座位必须是 `priority: -1`、override 必须
> 覆盖全部 107 个 token 且是 `{light,dark}` 成对。
>
> 真页面取证（`scripts/cdp_auth_shot.mjs`：用 `~/.dsh/.credentials.yaml` 里的
> `client-connection/browser-session` 密钥现签一枚 `dsh web` 会话 cookie，再驱动 headless Chrome
> 截**正在跑的**这个 GUI）：空会话大眼 + 侧栏小眼 + `FAIRY` 铭牌 + `#060915` 底；
> 会话页角落吉祥物在 (292, 612) 120 px；单击 → `data-fairy-eye` 变 `plain-glow`、约 3 s 后回到
> `plain-idle`；滚轮 → 108 px 并写进 localStorage；间隔 1.2 s 截两张图，吉祥物区域平均差 17.6/255、
> 89% 像素在动，同一张图里的空白网格区 0.0 —— 它确实在呼吸。样张见
> [`24-fairy-eye-states-090.png`](skin-refs/24-fairy-eye-states-090.png)、
> [`25-fairy-eye-live-090.png`](skin-refs/25-fairy-eye-live-090.png)。

> **0.8.6：大眼珠子整套删除（用户要自己重做；已被 0.9.0 取代）。** 用户：「删除大眼珠子，我另外重新做」。
> 这一版从客户端里移除**这只眼**的全部：角落 168px 吉祥物、侧栏 28px 小眼、空白页 148px 大眼，
> 以及 `orbSvg` / `ORB` / `ORB_INK` / `ORB_CSS` / `orbStore` / `Mascot` / `HeroEye`、
> 拖拽 / 滚轮 / 缩放 / 单击 / 双击、明暗状态机、5–30 s 撕裂时钟、`connection/reset` 撕裂订阅，
> 连 `localStorage` 里的 `dsh-fairy.eyePosition` / `dsh-fairy.eyeSize` / `dsh-fairy.orbVariant.v2`
> 也不再读写。**皮肤本体一行没动**：107 个 token、蓝图网格 + 顶光 + 暗角 + 四角定位标、
> 侧栏 `FAIRY` 铭牌、H.D.D. 状态药丸、输入栏状态轨、语音全部照旧。
> 舞台子层 8 → 7（少了吉祥物），槽位 7 → 5（少了 `sidebar.brand.mark` 与
> `conversation.hero.brand.mark`，侧栏品牌标记恢复随包样式）。
> 旧的 orb 样张脚本（`preview_eye` / `orb_solo` / `orb_asset_compare` / `orb_motion_shot`）
> 现在会打一行说明后退出；几何参数与取数脚本留在 `docs/fairy-skin.md` §2.3 供重做参考。

> **0.8.5：撕裂照视频改（两种、随机、5–30 s），四角旋转做成真看得见。** 用户三条裁定：
> ① 「去掉呼吸没让你去掉四角旋转」——把四角转回来；② 撕裂从固定时间改成 **5–30 s 随机**；
> ③ 撕裂有**两种**、随机（参考视频 `142_…旧梦的安可曲…（6）_1197-1229.mp4`）。
> 逐帧量完（`scripts/vid_orb_*.py`）：视频里 **`slice`** = 40 条细横带各自左右错开、
> **`roll`** = 4 条高横带各自上下错开，整段只有 3.9–5.6 s 那一串、**不是循环**；
> 而拿环带做旋转互相关，任意两帧（最长隔 4.3 s）最佳角度都是 **0°** —— 游戏自己的四角**不转**。
> 所以四角旋转是本站机关：把四角画成 **4 片不等长叶片 + 一条凹槽**（像视频里的四瓣那样不对称），
> 再 12 s 转一圈 —— 完全对称的形状转了也看不出来，这正是 0.8.4 那颗「静止」的原因。
> 撕裂现在是**事件**：随机等 5–30 s → 随机二选一 → 0.34 s；连接重同步/单击 = 同两种配方、位移 ×1.8。
> 与素材包逐像素比对平均差 3.8/255（差异只在四角，为了让旋转可见）。皮肤 token / 网格 / 槽位 / 语音未动。

> **0.8.4：加撕裂、删素环、删呼吸。** 用户三条裁定：
> ① 加上素材包的横带撕裂 —— 20 条横带各带自己的位移，每 3.6 s 闪 ≈86 ms
> （`<defs>` 里一份 drawing + 20 个带 `clip-path` 的 `<use>`，不是 20 份拷贝；
> 小于 96 px 的小眼不切带）；
> ② 删掉素环 —— `plain` 整套删除，`orbSvg` 不再接受 `variant`，`orbStore` 不再有
> `variant`/`cycleVariant`，存储键也不再读写；单击大眼珠子改成「撕一下」；
> ③ 删掉呼吸 —— 原设计里徽记尺寸不会变动，所以**整颗眼没有任何整体缩放**：
> 常态只剩环亮度 2.33 s、光场亮度 3.1 s、四角 3 s 转 90°、撕裂 3.6 s；
> `speak` / `alert` 也只改亮度与色相（不再放大），素材包那层「眼环 1.5 s 聚焦」一并删掉。
> 只有 `wake` / `fade` 这两种面板过渡仍是一次性缩放（进场 / 退场，不是呼吸）。
> 与素材包逐像素比对平均差 **1.7/255**；皮肤 token / 网格 / 槽位 / 语音一行未动。

> **0.8.3：大眼珠子改用用户自己找来的素材包重画。** 0.8.0 / 0.8.1 两轮都是「按帧测量」，
> 用户判定仍然不行（原话：「调整多次还是不行」），并提供了
> `fairy-mascot-standalone/fairy-mascot.svg`（「FAIRY Ⅲ 动态徽记」）。
> 这一版**只改这只眼的画法**：几何与配色全部转写成素材包自己的数字——
> 蓝盘 1.00 R（`#4053F0→#3045DC→#3D50C8`）+ 深色四角（0.76–0.89 R，3 s 转 90°）+
> 巩膜 0.706 R / 虹膜 0.485 / 0.346 R / 瞳孔 0.235 R / 右下高光 0.162 R @ (0.265, 0.301) R，
> 另加素材包的 1.5 s 眼环聚焦；实测的 2.33 s 呼吸保留。默认设计改回**四角环（gear）**，
> `plain` = 同一颗素材包的眼 + 第一季深蓝盘（无四角）；存储键改成 `dsh-fairy.orbVariant.v2`，
> 以免 0.8.1 存下的 `plain` 盖住素材包那版。与素材包逐像素比对平均差 **1.6/255**。
> 皮肤 token / 网格 / 槽位 / 语音一行未动。

> **0.8.2 修了一次回退事故（我这边引入的）。** 0.8.1 回退时把 hero 交接的订阅方法从
> `heroState` 上删掉了，但 `Mascot` 那行调用还留着 —— 于是 `shell.overlay` 整个渲染抛错，
> 框架换成一块 `data-slot-error` 占位：**大眼珠子、蓝图网格、四角定位标一起消失**，
> 而侧栏铭牌 / H.D.D. 药丸 / 输入栏状态轨（别的槽位）照常显示 —— 用户看到的就是「皮肤里没有大眼珠子」。
> 现在订阅恢复并改成"订阅即回报当前状态"，空会话交班不再靠时序；`scripts/test_client.mjs`
> 也补了守卫：**effect 现在会真的执行**（以前是空实现，所以这类只在 effect 里发生的崩法测不出来），
> 并做了变异自检（把那行改回旧调用 → 测试报 `Mascot threw: heroState.subscribe is not a function`）。

当前版本 **0.21.0**：`fairy` 人设 preset +
**绝区零街面 × H.D.D. 蓝视觉**（大眼珠子 = Fairy-DSH 的 mascot 本体，**两个座位**：侧栏 26 px /
对话区左下角 232 px，角落里那颗**可以拖着走**（0.19.0：默认仍在左下角，拖过之后记住偏移、
双击归位、越界自动夹回窗口内）；**会话页的光晕范围只有一半、空白会话页不动**（0.21.0：超出盘缘
57 px → 27 px）；输入框上方那条 H.D.D. 状态轨连同轨里 20 px 的小眼在 0.18.0 删掉了，
只剩一个 **右下角悬浮 VOICE 开关**；**空白会话不再有自己的座位**，改为「对话页版式 + 同一颗角落眼
放大 1.5 倍摆在对话区中央（侧栏右侧、输入框上方，随侧栏宽度重新量）」，那一颗是页面本身、不参与拖动；睫毛转、四层虹膜呼吸、
随机横向撕裂、白闪、thinking/comforting 眼睑；
0.16.1 删掉了「变纯白」与「泛出涟漪」两个特效；半调 + 扫描线 + 黄定位角标）+
**GPT-SoVITS 语音摘要（自动朗读回复的一句话摘要，CUDA 推理；可切回 0.6.x 的整条逐句朗读）**。

## 它做了什么

- `cordis.patch.yml` 用 `@deepseek-ai/dsh-agent-preset` 插入 `preset-fairy`；
  `config.id: fairy`，显示名 **Fairy（仙灵）**，order 6。
- `config.plugins` 从随包的 `cordis` preset 整份复制——**工具集与标准模式完全一致**
  （fs / pwsh / jobs / web / skills / subagent / plan mode / compaction …），
  只有 `persona` 一行被换掉：前缀正文来自 `persona/prefix.md`。
- 人设的取材、语言指纹、幽默机制、红线写在仓库的 `docs/fairy-persona.md`。
- **语音摘要（0.7.0，默认）**：Fairy 答完一条回复后，插件先把它压成**一句话摘要**
  （`speakMode: summary`，默认 60 字），再合成语音自动播放；完整回复不再逐句念。
  摘要先走一次轻量模型调用（用回复自己的 provider/model，关思考、6 秒上限），
  失败/超时/输出为空就退回**本地提取**：取回复开头那段结论句，跳过代码块、表格、链接与行内代码。
  只朗读**结束当前轮次的那条回复**，历史消息、带工具调用的过程句一律不念；自动路径按
  messageId 去重，同一条回复不会播两遍。消息操作条保留 **▶ 摘要 / ▶ 全文** 两个手动按钮。
  接线细节见 `docs/voice-engine.md`。
- **0.6.x 的语音回复仍在**：`speakMode: full` + `streamSpeech: true` 回到「边输出边逐句念」，
  `lib/index.js` 订阅 `agent/assistant-stream` 的实时说话人一行没动。
- **视觉（0.10.0：绝区零街面 × H.D.D. 蓝）**：`client/client.js` 注册主题 `zzz-hdd`
  （107 个 token，`#05070F` 底、`#2F6BFF` 品牌蓝、`#7FD4FF` 青色 HUD、`#FFD52E` 警示黄），
  **并把同一份 token 叠成 `overrideTokens` 图层**（注册的 theme id 不会被持久化，靠 pin 撑不过一次启动）；
  在 `shell.overlay` 上铺 **8 层**纯装饰：半调网点、H.D.D. 蓝辉光、扫描线、暗角、
  四个黄色 L 定位角标。蓝图网格已删除。
  - **大眼珠子（0.16.0：Fairy-DSH 本体；0.16.1 去掉两个特效）**：`client/fairy-mascot.port.js`
    逐条移植 github.com/Chengzhibense/Fairy-DSH（Apache-2.0）的 mascot —— 几何（外盘 68 / 巩膜 48 /
    虹膜 33·24.15·23.5 / 瞳 16 / 右下高光 r11 @ (98,100.5)）、三段渐变、横光晕线场、
    全部 CSS 与关键帧、以及它自己的运行时（1440 ms 主时钟、0.72 s 四层错相呼吸、15 s 睫毛旋转、
    `cubic-bezier(.72,0,.28,1)` 的缓动复算、随机故障调度、白闪、低电量、
    `prefers-reduced-motion`、`pagehide`/可见性冻结）。0.16.x 是四个座位各一个实例，0.17.0 起三个座位、
    0.18.0 起两个座位，
    每个座位一个实例，**id 按实例命名空间化**，所以几只眼互不串 defs / `<use>` 克隆 / 可变的横带矩形。
    0.16.1 删掉的是上游的**睫毛脉冲环**（涟漪）与**每次换表情的两段故障爆闪**（整眼发白），
    并把白闪圆改成带 `opacity="0"` 呈现属性，避免 `<use>` 横带克隆把白盘也克隆出来。
    与上游同一帧逐像素对照（`scripts/mascot_compare.mjs`）= **0/255**（上游页同样不挂脉冲环、
    白闪圆补同一属性，比的才是「其余部分」。另外还有一条故障帧近白守卫：≤ 35%）。
    唯一没照抄的是「CSS 里直接写 id」的那两条规则（横纹故障的 `filter` 与两种眼睑的 `clip-path`）：
    id 既然按实例命名空间化，这两条就由实例自己写成内联声明，效果与上游逐像素一致。
  - **四个座位 → 三个座位（0.17.0）→ 两个座位（0.18.0）**：侧栏 26 px（`sidebar.brand.mark`，
    `priority:-1` 顶掉随包鲸鱼）、对话区左下角 232 px（`conversation.input.left`，零尺寸锚点量出
    输入卡片位置后 `fixed` 钉住；窗口 < 1180 px 或高 < 620 px 时隐藏）。0.18.0 删掉的是输入框上方
    状态轨里那颗 20 px 的眼睛（整条轨一起删，见下）。
    空白页 66 px 那个座位**不再是眼睛**：`conversation.hero.brand.mark` 现在挂 `HeroQuiet`
    （仍 `priority:-1`，只为拿到「宿主 hero 标题行里」的节点），负责把宿主 hero 那个标题块
    整个藏掉（按结构找：向上走到「兄弟里装着输入框的那层」），让空白会话落回对话页版式
    （输入卡片在底部、原先状态轨的位置现在是空的）。
  - **空白会话页（0.17.0 最小版）**：用户要求「空白会话页面与非空白会话页面格式一致，区别只在于
    左下角的大眼珠子放大并置于屏幕中央」→ 第二轮改为「放在侧边栏右侧、输入框上方这一片区域的中央，
    位置随动侧栏，大小 2 倍 → 1.5 倍」。实现只有两条 CSS（都用宿主自己的 `data-content-phase` /
    `data-conversation-scroll` 属性做题面，不碰哈希类名）+ 两个测量值：① hero 阶段的滚动区改
    `justify-content:flex-end`（版本居中 → 底部）；② **同一块** `.dshf-corner-plate` 在 hero 阶段取
    `left:var(--dshf-blank-eye-x)` / `top:var(--dshf-blank-eye-y)` + `translate(-50%,-50%) scale(1.5)`，
    这两个变量由 `GutterEye` 从 `[data-conversation-content]`（对话列，侧栏收放会变宽 → `ResizeObserver`
    跟着重测）与 `[data-composer-seat]`（输入区上沿）量出来：横向居中于对话列，纵向居中于「列顶到输入区顶」
    这一片。`--dshf-blank-eye-scale` 可调（默认 1.5，窄窗/矮窗降到 1.2）；眼是矢量，放大不失真；
    角落眼不再被 hero 座位让位
    （`live = Boolean(box)`），**全屏始终只有一只 Fairy**。
    刻意保留的差异：hero 那行**工作区 chip + 预设选择**还留着（那是切工作区/选 preset 的唯一入口，
    删了就选不了）；要不要一起去掉等用户定。
  - **角落那颗眼是拖动的（0.19.0）**：用户「将 fairy 做成可拖动的，默认位置在左下角」。
    `GutterEye` 的 `.dshf-corner-plate` 自己当把手：`pointer-events:auto` + `cursor:grab` +
    `border-radius:50%`（**只有画出来的那颗圆盘吃指针**，方框四角照旧点穿，聊天文字仍可选可点），
    SVG 子元素一律 `pointer-events:none`。拖动写的是一个**相对座位的偏移量** `{x,y}`
    （`dsh-fairy.eyeOffset`，localStorage），不是绝对坐标 —— 所以侧栏收放、输入卡片长高时
    座位重测，眼跟着走而偏移不变；`clampEyeOffset()` 把它夹在窗口内（四边各留 8 px，
    窗口缩小时自动拉回，不会飘出屏幕）；**双击归位**（清 key，回到量出来的左下角座位）。
    空白会话页那颗眼**不参与**：hero 阶段 CSS 直接把 plate 钉在量出来的中央并
    `pointer-events:none` / `cursor:default`，那是页面本身，不是把手。
  - **会话页光晕缩一半，空白页不动（0.21.0，最小版）**：用户「空白会话的 fairy 不变，
    非空白会话的 fairy 光晕范围缩小 50%」。两条规则都挂在宿主自己的
    `[data-content-phase]:not([data-content-phase="hero"])` 上，所以只碰会话页：
    ① `.dsh-fairy-halo-layer`（横向光带场）**加 CSS 遮罩**——盘缘以内全亮，到 1.4R 渐隐为 0
    （`radial-gradient(ellipse 18.8% 30.6% at 50% 46.875%, #000 0 72%, transparent 100%)`；
    层盒 754×464、眼在 50%/46.875%，椭圆两轴换成 px 都是 142 px，因为盒子不是正方形）；
    ② `.dsh-fairy-outer-halo`（盘外环形辉光）`transform:scale(.934)`，超出盘缘那 10 个 viewBox 单位
    缩成 5。
    **为什么不直接 `transform:scale(.5)`**：光带场的线只有 0.62 viewBox 单位粗，缩一半后落到
    0.45 px 以下、整片光带等于消失（这条弯路真跑过：近景里光晕直接没了，只留遮罩版才是「范围减半、纹理还在」）。
    量化验证：`scripts/halo_profile.mjs` 在同一页面拍「光晕隐藏 / 本版 / 0.19.0 原样」三张，
    取差值的径向亮度剖面 —— 超出盘缘部分 **57.1 px → 27.1 px（47.5%）**；
    `scripts/eye_shot.mjs --blank` 复核空白页：`mask-image: none`、环 `transform: none`、
    光晕盒仍 1131×696（1.5×），即完全没动。
    近景对照：`docs/skin-refs/39-fairy-halo-half-ab-021.png`。
    侧栏那颗 26 px 眼不在 `[data-content-phase]` 子树里，规则碰不到它（实测 `mask-image: none`）。
  - 侧栏 `FAIRY` 铭牌 + 黄色斜切小条 + 小字（`priority:-1` 才盖得住随包品牌）、
    脚部**斜切 H.D.D. 胶带**（呼吸点 2.4 s）。
  - **右下角悬浮 VOICE 开关（0.18.0）**：用户「删除会话中，输入框上面这个东西，把【voice】
    调整到右下角」→ 整条 H.D.D. 状态轨（斜切黄条 + 20 px 眼 + `Fairy` 斜铭牌 +
    `RANDOM PLAY · 录像店二楼` + 18 根波形 + `VOICE` + `REF F-Ⅲ`）删掉，**只留 VOICE**，
    `position:fixed; right:14px; bottom:14px`，`z-index:10050`（高于总挂在窗口右下角的
    鲸鱼娘挂件 9999；不提层的话开关会落进她那个图层，看不见也点不到）。它**不在输入区的流里**：
    `VoiceCorner` 仍挂 `conversation.input.dock`（那是唯一能把实时会话 id 交给语音流的座位），
    但只把 `<body>` 上的 portal 渲出来、dock 行本身不占高度 —— 所以会话里输入卡片不再被顶下去一行。
    状态点：亮 = 自动朗读摘要已开（黄），暗 = 关（青），关过就记住（`dsh-fairy.voiceAuto`）。
- 输入框本身**保持随包样式**（0.3.2 的对话框化已撤销）。


## 安装（本仓库已在 web profile 上装好）

```powershell
# 装（本地开发用 link，改文件即改源码）
dsh plugin --profile web add link:<仓库绝对路径>\plugin\dsh-fairy
# 或交给插件管理器（Web「插件」页 / plugin_manager 工具）
```

安装后 `~/.dsh/profiles/web/package.json` 会多出依赖 `dsh-fairy` 和 bundles 条目 `dsh-fairy`。

> **bundle 只在进程启动时组合**：装完必须重启 DSH（重开 `dsh web`），
> 新建会话时在模式/预设选择器里选 **Fairy（仙灵）**。已存在的会话保持它启动时的预设。
>
> **0.7.0 升级提醒**：`lib/index.js`（host 半边）是进程内代码，改完同样要重启 dsh；
> 只改 `client/client.js` 时浏览器 HMR 会自己刷新。重启后
> `GET /fairy-voice/status` 应返回 `"speakMode":"summary"` 与 `"summary":{…}`。

## 语音引擎（0.7.0）

素材里的 Fairy 模型是 **GPT-SoVITS v2 的微调权重**，不是可播放音频；本仓库在
`engine/` 里搭了两套本地引擎：`\.venv`（CPU）与 `\.venv-cuda`（CUDA，默认）。
完整说明、五个本机坑、GPU 补丁与实测延迟见
[`docs/voice-engine.md`](voice-engine.md)：

```powershell
# 一次性准备（幂等；CPU 版约 3 GB 下载，走 hf-mirror / modelscope / 清华 PyPI 镜像）
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\setup_engine.ps1
python scripts\configure_engine.py

# 可选再加 CUDA 版（复制 venv + 换 torch cu121 + 补丁，约 +3.2 GB）
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\setup_cuda_engine.ps1
python scripts\patch_cuda_engine.py

# 单独验证引擎（自动启停 api_v2，合成两句并报延迟/时长）
engine\.venv-cuda\Scripts\python.exe scripts\measure_cuda_tts.py http://127.0.0.1:9880
```

插件按 `cordis.patch.yml` 里 `dsh-fairy` 行的 `config` 使用引擎（`engineCommand` / `engineUrl` /
`refAudio` / `refText` / `cacheDir`；这些是**本机绝对路径**，换机器要改这一行）。
当前默认：`.venv-cuda\Scripts\python.exe` + `engine-data\tts_infer_cuda.yaml`（`device: cuda`，
fp32）。就绪 6–8 秒，首句 0.6–0.8 秒，吞吐约 3.3× 实时；显存吃紧可换 `tts_infer_cuda_fp16.yaml`。
CPU 版是回退路径（约 1.7× 实时），改回 `.venv` + `tts_infer.yaml` 即可，两边互不影响。
`autoStart: true` 时第一次朗读（或打开 VOICE 时的 `status?warm=1`）会自动拉起 api_v2 进程，
并额外合成一句探针把首帧开销吃掉。
合成结果按文本 sha1 缓存在 `engine/engine-data/voice-cache/`，重复内容不再跑模型。

浏览器里：**页面右下角悬浮的 VOICE 开关**（默认开启，关过就记住）、每条助手消息的 **▶ 摘要 / ▶ 全文**。
开关打开时浏览器会连上 `GET /fairy-voice/live?session=…`（SSE），顺带把引擎预热；
新回复定稿后浏览器调 `GET /fairy-voice/auto`，拿回**摘要**的 wav 自动播放。
实测（`scripts/test_summary_voice.mjs`，GPU fp32，411 字回复；两次运行分别在这台机器空闲与
被别的引擎争用时测得）：

| 路径 | 合成耗时 | 音频时长 |
|---|---|---|
| 自动摘要（60 字） | **4.6–9.7 s** | **9.0–9.6 s** |
| 手动全文 | 17.7–31.2 s | 38.2–39.5 s |

摘要比全文短 4.0–4.3×、合成快 3.2–3.9×。摘要先走一次轻量模型调用（真实 `llm` 服务已在隔离
实例里验证：`deepseek-official / deepseek-flash`、关思考，返回一句 60 字内的中文摘要），
失败或超时自动退回本地提取。打开 VOICE 后首次进会话仍会预热引擎（就绪 6–8 秒）。
把 `speakMode` 设为 `full`（并保持 `streamSpeech: true`）回到 0.6.x 的「边输出边逐句念」；
把 `streamSpeech` 设为 `false` 则是「整条合成完再播」的 0.5.0 行为。
关闭语音：关掉开关，或把 `config.enabled` 设为 `false` 后重启。

## 验证

```powershell
# 1) 组合层面：preset-fairy 与 dsh-fairy 两行都应在
dsh --profile web --dump-config | Select-String 'preset-fairy|dsh-fairy'

# 2) 浏览器半边：无浏览器也能跑的自检（stub 掉模块加载器与 React）
node scripts/test_client.mjs
#    → 107 个 token + 107 对 override / 8 个槽位 / 8 个舞台子层 / 三处 single 座位 priority -1 /
#      眼睛座位全是同一个 FairyEye、尺寸 26/232（0.18.0 起没有状态轨 20 px 那只）+
#      空白页 HeroQuiet 不再渲眼睛 + 空白页两条 CSS 规则（底部对齐 / 居中放大）必须在样式表里 /
#      无 data:image/webp 与 EYE_ASSETS / 移植块与 client/fairy-mascot.port.js 逐字节一致 /
#      眼睛标记与渐变 id 按实例命名空间 / activity 投影（running → thinking、创伤 → comforting、
#      压话 → 正常、恢复 → 正常）/ 样式表必须含 Fairy-DSH 的关键帧与 prefers-reduced-motion /
#      0.18.0：轨的样式（dshf-rail / dshf-wave / dshf-chip / dshf-meta）不许回来、VOICE 必须
#      portal 到 <body> 且钉在 right/bottom 14 px、开关带 VOICE 文案 / 卸载无残留
#    失败时退出码非 0；`node scripts/test_client_mutations.mjs` 会把十六条回归打进去，
#    确认这个测试真的会红（priority 0、拔 override、删舞台层、摘睫毛、停睫毛旋转、脉冲环回来、
#    白闪圆丢属性、换表情重挂过场、移植块漂移、删安慰判据、摘空白页眼睛座位、摘左下角眼睛、
#    0.18.0 的「portal 拆掉」「角上偏移漂走」「删掉的轨样式回来」「弹窗让位规则失效」）

# 2b) 外观：与 Fairy-DSH 上游逐像素对照（0.16.0/0.16.1 的核心证据）
node scripts/mascot_compare.mjs
#    → 上游模块（.cache/Fairy-DSH-src）与本仓库移植各渲一页，同一帧冻结后逐像素比：
#      六个用例（normal / thinking / comforting / 横纹故障 / 横带故障 / 低电量）差 = 0/255；
#      同一脚本再验运行时：DOM 齐全、睫毛 CSS 动画在跑、JS 时钟两帧之间真的换了 transform、
#      setState('thinking') 只换眼睑（不再有故障过场/过渡属性）、眼睑 clip 指向自己的 id、
#      双实例 id 不串、dispose 清空；**没有脉冲环**（层数 0、动画 0）；
#      另跑一张故障帧，用 scripts/mascot_white_check.py 卡「近白像素 ≤ 35%」（当前 ~15%，
#      删特效前是 56%）。
#      （上游源码：.cache/Fairy-DSH-main.tar.gz 解到 .cache/Fairy-DSH-src/）
#    0.13–0.15 的眼睛预览脚本（scripts/preview_orb.mjs、preview_mascot.mjs、orb_* 系列）自 0.16.0 起
#    不再跟踪出货的眼睛，按仓库「不删文件」的规矩留档；要看出货效果用上面的 mascot_compare.mjs。

# 2c) 真页面（dsh web 正在跑时）：现签会话 cookie 截真 GUI
node scripts/cdp_auth_shot.mjs "http://127.0.0.1:3080/" .cache\live.png 1440 900 9000
#    → 会话页（0.18.0）：侧栏 26 px 眼 + FAIRY 铭牌（黄斜条）+ 左下角 232 px 眼
#      + 半透网点/扫描线/黄定位角标；输入框上方**没有**状态轨了，整列只剩输入卡片，
#      页面右下角（距右/底各 14 px）一枚 64×25 的 `VOICE` 悬浮开关（portal 到 <body>，
#      `z-index:10050`，压在鲸鱼娘挂件 9999 之上，点得到）；
#      空白页（0.17.0）：同一颗眼放大 1.5 倍摆在对话区中央
#      （侧栏右侧、输入框上方，侧栏收放后仍居中），输入卡片回到页面底部、hero 标题不见；
#      实测每个 mascot 实例（fairy-m1..m2）、各自 float/halo/pulse/main 齐全、
#      `data-state` 与 JS 时钟 transform 都在动、`[data-slot-error]` = 0
#      （0.18.0 三次实测：1440×900 空白页 / 2234×900 会话页 / 1280×720 空白页，
#      `elementFromPoint` 在角上都命中 `button.dshf-btn`，点一下 → 关（`voiceAuto=0`），
#      再点一下 → 开）

# 2d) 拖动（0.19.0，真页面 + 真输入事件，11 条断言）
node scripts/drag_check.mjs
#    → 默认座位移出媒体列左下角 (296,478)、cursor:grab、圆心命中 plate / 方框角命中聊天节点；
#      真实 Input.dispatchMouseEvent 拖 (+200,+110) 精确落位、localStorage 记 {"x":200,"y":110}；
#      刷新后仍在原位；拖过右下角夹到 (1432,892) = 窗口 -8 px；双击回 (296,478) 且 key 清空；
#      空白页仍 360×360 居中 1.5 倍且拖不动；收起侧栏后对话列 280→56、眼 296→72（同位移）；
#      截图落在 .cache/drag-check-after-drag.png 与 .cache/drag-check-after-collapse.png

# 2f) 光晕范围（0.21.0，量化）
node scripts/halo_profile.mjs
#    → 同一页面三张（光晕隐藏 / 本版 / 0.19.0 原样），差值取径向亮度剖面：
#      full  reach 160 px（超出盘缘 57.1）/ half reach 130 px（超出盘缘 27.1）= 47.5%
node scripts/eye_shot.mjs .cache\eye-half-conv.png 64 2
node scripts/eye_shot.mjs .cache\eye-half-blank.png 64 2 --blank
#    → 会话页 mask-image 有径向渐变、环 transform matrix(0.934…)；空白页 mask-image:none、
#      环 transform:none、光晕盒 1131×696（=1.5×754×464），即空白会话完全没动
#      近景 A/B：docs/skin-refs/39-fairy-halo-half-ab-021.png

# 3) 运行层面：重启后新建会话，模式选 Fairy（仙灵），第一句应该是
#    「系统启动完成——我是Ⅲ型总序式集成泛用人工智能，开发代号 Fairy。你好，主人。」
#    界面 = 深蓝底 + 侧栏眼板/FAIRY 铭牌/斜切 H.D.D. 胶带 + 右下角 VOICE 悬浮开关。

# 4) 语音层面（不需要浏览器）：
node scripts/test_host.mjs           # 路由 + 摘要两条车道（模型/本地兜底）+ 轮次过滤 + 全文/摘要/SSE（mock 引擎）
node scripts/test_voice_client.mjs   # 客户端 slot 接线（默认开启 / 摘要+全文按钮 / 关过记住）
node scripts/test_summary_voice.mjs  # 真引擎：摘要 vs 全文的合成耗时与音频时长
node scripts/test_live_voice.mjs     # 真引擎：0.6.x 逐句流式（需 speakMode: full + 已起引擎）
engine\.venv-cuda\Scripts\python.exe scripts\measure_cuda_tts.py http://127.0.0.1:9880  # 真实延迟/吞吐
#    真机：引擎起来后 GET http://127.0.0.1:<dsh端口>/fairy-voice/status → {"engine":"ready","speakMode":"summary"}
```

## 想再关掉视觉

在 `cordis.patch.yml` 末尾把 `- insert: / - id: dsh-fairy / - name: dsh-fairy` 三行注释掉
（或把 `scripts/gen_fairy_preset.py` 的 `SKIN_ENABLED` 改成 `False` 重新生成），重启即可；
人设 preset 不受影响。

## 路线图

| 版本 | 内容 |
|---|---|
| 0.1.0 | agent preset / 人设 ✅ |
| 0.2.0 | 第一版皮肤（黑 + 黄绿）——方向不对 |
| 0.3.0 | 深蓝 H.D.D. 主题 + 大眼球（眨眼/追视/拖拽） |
| 0.3.1 | 眼球 168px + 滚轮缩放；空白会话大眼交接；侧栏铭牌/药丸；输入栏两条状态轨 |
| 0.3.2 | 输入框改成游戏对话框 + 底色再调蓝 + 去网格 —— **被判不行** |
| 0.4.1 | 只回退 0.3.2 那一步，视觉回到 0.3.1 形态 |
| **0.5.0** | **语音回复**：GPT-SoVITS v2 本地引擎 + `/fairy-voice` 路由 + VOICE 开关/单条朗读 ✅ |
| **0.6.0** | **边输出边念**：订阅 `agent/assistant-stream`，逐句合成 + SSE 推送 + 按句播放；`/auto` 去重、`/quiet` 停合成 ✅ |
| **0.6.1** | **CUDA 推理**：`.venv-cuda`（torch 2.5.1+cu121）+ TorchScript 块搬迁补丁；吞吐 1.7× → 3.3× 实时，75 字念完 12.4 s → 5.3 s ✅ |
| **0.7.0** | **语音摘要**：自动朗读一句话摘要（模型摘要 + 本地提取兜底），只念当前轮次、不复读；VOICE 默认开启；手动 ▶ 摘要/▶ 全文；`speakMode: full` 保留 0.6.x 逐句流式 ✅ |
| **0.8.0** | **大眼珠子按素材包重做**：三层同心 + 固定内球、只保留实测的呼吸；删掉眨眼/虹膜追视；状态机（运行/报错/重同步撕裂/淡出交班）；单击换季（素环/齿轮环）；`scripts/orb_compare.mjs` + `scripts/shot.ps1` 做像素对照 ✅ |
| **0.8.1** | **只重画大眼珠子**：按用户 1080p 参考片段（044 号，252 帧）逐带重测——奶油环 0.72–0.97 R、细亮圈 0.565 R、外缘亮环 1.60 R、深蓝盘 1.55 R、光晕 2.05 R，补横向/纵向光斑与内球亮弧；默认季改素环；`scripts/orb_v2_compare.mjs` + `orb_v2_profile.py` 逐带对表（核心环带 ≤11 灰阶）；皮肤/输入框/布局未动 ✅ |
| **0.8.2** | **修复回退事故**：`Mascot` 还在调用已删除的 `heroState.subscribe` → `shell.overlay` 渲染抛错，珠子/网格/角标整块消失；订阅恢复并改为订阅即回报，空会话交班不再看时序；`test_client.mjs` 让 effect 真的执行 + 变异自检 ✅ |
| **0.8.3** | **大眼珠子按用户素材包重画**：放弃 0.8.0/0.8.1 的「按帧测量」，改为转写 `fairy-mascot-standalone/fairy-mascot.svg` 的几何与配色（蓝盘 1.00R + 深色四角 0.761/0.894R + 巩膜 0.706R + 虹膜 0.485/0.346R + 瞳孔 0.235R + 右下高光 0.162R @ (0.265,0.301)R）；带上素材包的 1.5s 眼环聚焦与 3s 四角转动；`scripts/orb_solo.mjs` + `orb_asset_diff.py` 逐像素比对（平均差 1.6/255）；皮肤/输入框/布局/语音未动 ✅ |
| **0.8.4** | **加撕裂 / 删素环 / 删呼吸**：① 素材包的 20 条横带撕裂常驻（3.6s 周期、≈86ms、各带位移按 240/260 折进 viewBox；`<defs>` 一份 drawing + 20 个 `clip-path` 的 `<use>`，<96px 不切带）；② `plain` 整套删除，`orbSvg` 不再接 `variant`、`orbStore` 去掉 `variant`/`cycleVariant`，单击改成「撕一下」；③ 徽记不再有任何整体缩放（删 `fo-breathe`、`fo-speak` 缩放、`fo-alert` 缩放、素材包的 1.5s 眼环聚焦），只留亮度/色相/四角转/撕裂，`wake`/`fade` 仍是一次性面板过渡 ✅ |
| **0.8.5** | **撕裂照视频改、四角旋转做成看得见**：① 四角改成极坐标路径——底盘 0.735R + 四片**不等长**叶片（0.920/0.828/0.888/0.848R）+ 一条凹槽，12s 转一整圈（对称形状转了也看不出，这是 0.8.4「静止」的原因）；② 撕裂从固定 3.6s 循环改成**事件**：随机 5–30s 等一次（`ORB.tearMin/tearMax`），每次 0.34s；③ 两种配方随机二选一：`slice` = 40 条细横带左右错开、`roll` = 4 条高横带上下错开（照 `142_…旧梦的安可曲…` 逐帧量出来的两种撕裂）；静止时只留 1 个 `<use>`，种子决定每次的位移图案；`scripts/vid_orb_*.py` 取证、`scripts/orb_motion_shot.mjs` 出静帧；`test_client.mjs` 锁死时钟范围与「四角必须不对称」 ✅ |
| **0.8.6** | **删除大眼珠子**（用户要自己重做）：移除 orbSvg / ORB / ORB_CSS / orbStore / Mascot / HeroEye、
三处眼睛渲染（角落/侧栏/空白页）、拖拽缩放单击、撕裂时钟与 `connection/reset` 订阅、三个 `localStorage` 键；
舞台 8→7 层、槽位 7→5；皮肤 token / 网格 / 铭牌 / 药丸 / 状态轨 / 语音未动；旧样张脚本改为自报退出 ✅ |
| **0.9.0** | **大眼珠子用原片像素回来**（后被 0.9.1 撤掉）：`素材/fairy-eye-1to1/` 六状态重采样成 192px·15fps 动画 WebP（1.0 MB）内联进 bundle；三座位、可拖可缩放；顺手把 single 槽位改 `priority: -1`（FAIRY 铭牌此前一直没显示）与调色板改走 `theme.overrideTokens` ✅ |
| **0.9.1** | **大眼珠子整套删除（第二次）**：用户判定「问题很大」，三个座位 + 六状态播放器 + `eyeStore` + 1.41 MB 内联块全部移除；`client.js` 1.44 MB → 31 kB，舞台回到 7 层、槽位回到 5 个；**保留** 0.9.0 的两处非眼睛修复（FAIRY 铭牌 `priority: -1`、调色板 override）；生成脚本与 webp 资产不删，重做只需一条命令 ✅ |
| **0.10.0** | **绝区零街面画风 + 大眼珠子第三次回来（带框）**：眼睛只用 1:1 原片两个循环状态（`plain-idle` 479 KB / `plain-speak` 234 KB，200 px·30 fps·q78），三个座位全带 H.D.D. 板（侧栏 26 / 空白页 66 / 状态轨 20）；删蓝图网格，换半调 + 扫描线 + 蓝辉光 + 黄定位角标（胶片齿孔横带 2 层当时在，0.10.1 删除）；铭牌加黄斜条、脚部改斜切胶带、状态轨挂到输入卡片**上方**（放下面会被 shell 状态条压住）；主按钮改黄底黑字；`client.js` 0.96 MB ✅ |
| **0.10.1** | **删掉上下两条胶片横条**（用户贴图裁定）：去掉 `.dshf-strip.is-top/.is-bottom` 两层与 CSS，舞台 10 → **8 层**，黄角标 21 → 12 px；`test_client.mjs` 把 `dshf-strip` 列为「不许回来」并把层数锁 8；其余皮肤原样；真页面复核窗口最上/最下已无黑边、`[data-slot-error]` = 0 ✅ |
| **0.11.0** | **输入卡片左下角加大号 Fairy**（当时 96×110 px 板，贴在卡片外侧）—— 用户指出位置不对，**0.12.0 已改位置** |
| **0.12.0** | **大眼面板搬进对话区左下角**（用户划框）：「对话框左下角这个删除」，改为 240×250 px 面板（196 px 眼 + 34 px 名字条），用零尺寸锚点量出输入卡片位置后 `fixed` 钉在「列左 + 16、H.D.D. 状态轨上方 8 px」，卡片与状态轨的 `ResizeObserver` 一起跟高度；空白页有 hero 眼时隐藏、< 1180 px / < 620 px 隐藏；实测 242×252 @ (296,470)、底边 722、状态轨完整可见、`pointer-events:none`、`[data-slot-error]` = 0；`test_client.mjs` 锁「面板不吃点击 / 1180 px 逃逸 / dshf-gutter 不许回来」 ✅ |
| **0.13.0** | **眼睛改回矢量**（用户：「你做的 fairy 动画不是矢量的」）：SVG 遮罩 `FairyOrb` 替换全部内联动画 WebP（0.93 MB → 0），几何按 1:1 原片逐环带实测、动作照实测只做亮度呼吸（2.41 s / 说话 1.19 s）；四个座位 / 舞台 / 状态轨不变；bundle 0.96 MB → 51 kB；`test_client.mjs` 锁「无 data:image/webp、无 EYE_ASSETS、遮罩四层齐全、说话态 is-speak」，变异自检 6 条全部变红 ✅ |
| **0.14.0** | **原片回退 + Fairy-DSH 动态徽记**：0.13.0 的矢量甜甜圈整套删除，三个小座位回到 0.12.0 的原片动画 WebP；左下角 196 px 面板换成按 Fairy-DSH（Apache-2.0）重写的 `FairyMascot`（睫毛 15 s/turn、虹膜 0.72 s 四层错相、光圈 4 s、故障 9 s、挂载白闪，纯 CSS）；`test_client.mjs` 双锁两边 + 6 条变异全红 ✅ |
| **0.15.0** | **左下角只留眼睛**：去掉 240×250 面板的边框/底色/阴影/黄斜条/名字条，`.dshf-corner-plate` 变成透明定位盒；眼睛 196 → 232 px；会话页实测 240×240 @ (296,482)、底边 722、`pointer-events:none`、`[data-slot-error]` = 0；动画与四个座位其余部分不变 ✅ |
| **0.16.0** | **整套换成 Fairy-DSH 的 fairy**（用户：「完全复制 Fairy-DSH 这个项目里的 fairy，包括各种动态动作」）：1:1 原片 WebP 三座 + 0.13.0 矢量遮罩 + 0.14.0 纯 CSS 仿制全部删除，改为逐条移植上游 `mascot-*` 七个模块（几何/渐变/光晕线场/脉冲环/全部 CSS 与关键帧/1440 ms 主时钟/随机故障调度/两段过场/白闪/低电量/可见性冻结），四个座位各一实例、id 按实例命名空间化；会话活动投影（running → thinking、comfort 判据 → comforting）驱动两种眼睑；`scripts/mascot_compare.mjs` 上游 vs 移植同帧逐像素 **0/255**（六用例）+ 运行时校验，`test_client.mjs` 九条变异全红；`client.js` 1.03 MB → 118 kB ✅ |
| **0.16.1** | **删掉两个特效**（用户：「fairy 变纯白的特效，和泛出涟漪两个特效删除，其他保留」）：① 换表情的两段故障爆闪 `playStateTransition` 整段删除（那是整眼发白的直接来源）；② 白闪圆改成带 `opacity="0"` 的**呈现属性**——上游靠 CSS 压住它，而那条规则进不到 `<use>` 的 shadow tree，于是 5 条横带克隆各画一张全白圆盘，这才是纯白的真正来源（故障帧近白 56.6% → 14%）；③ 睫毛脉冲环整层删除（`PULSE_SVG` / `.dsh-fairy-pulse-layer` / 三条 `dsh-fairy-lash-pulse*` 关键帧 / `--dsh-fairy-pulse-cycle`）；保留睫毛旋转、四层虹膜呼吸、随机横纹/横带撕裂、白闪、thinking·comforting 眼睑；`mascot_compare.mjs` 六用例仍 **0/255**，并新增「故障帧近白 ≤ 35%」守卫；`test_client_mutations.mjs` 十二条变异全红 ✅ |
| **0.17.0**（最小版，**未定稿**） | **空白会话页改回对话页版式 + 大眼珠子居中放大**（用户：「空白会话页面调整为与非空白会话页面格式一致，区别在于左下角的fairy大眼珠子放大并置于屏幕中央」，要求先出最小版看效果再定回退/继续；第二轮：「不是放在屏幕正中央，而是放在侧边栏右侧、输入框上方这一片区域的中央，位置可以随动侧栏；大小 2 倍 → 1.5 倍」）：删掉空白页 66 px 座位与它的 `heroSeats` 交接（`HeroEye` → `HeroQuiet`，`priority:-1` 不变）；`HeroQuiet` 不渲眼睛，只按**结构**（向上找到「兄弟节点里装着输入框/状态轨」的那一层＝hero 根）把宿主 hero 那个标题块整个 `display:none`，结构对不上就什么都不做、页面保持宿主原样，卸载按属性还原；两条 CSS 用宿主 `data-content-phase` / `data-conversation-scroll` 属性把 hero 阶段滚动区改底部对齐（→ 输入卡片落回底部）、把**同一块** `.dshf-corner-plate` 摆到 `--dshf-blank-eye-x/y` 并 `scale(1.5)`（窄窗/矮窗 1.2、未量到之前不显）；这两个测量值由 `GutterEye` 从 `[data-conversation-content]`（横向居中，侧栏收放会改宽 → `ResizeObserver` 重测）与 `[data-composer-seat]`（纵向：列顶到输入区顶的中点）算出；角落眼不再因 hero 座位让位（`live = Boolean(box)`），全屏仍只有一只 Fairy；`EYE_SIZE` 去掉 `hero`、`dshf-tile-lg` 删掉；相位翻转补一次 `MutationObserver` 重测（首条消息落地时尺寸不变，`resize`/`ResizeObserver` 不会触发）；`test_client.mjs` 改锁「HeroQuiet 不再渲眼睛 / 空白页三件：底部对齐、1.5 倍居中、测量变量必须在样式表里」并通过。**未目视**：浏览器截图在本机沙箱内起不来（Chrome mojo 拒绝访问），真 GUI 效果等用户确认；工作区 chip + 预设行**暂时保留**（删了就没法切工作区/选 preset） |
| **0.18.0** | **删掉输入框上方的 H.D.D. 状态轨，VOICE 挪到右下角**（用户：「删除会话中，输入框上面这个东西，把【voice】调整到右下角」）：`conversation.input.dock` 那条轨（斜切黄条 + 20 px 眼 + `Fairy` 斜铭牌 + `RANDOM PLAY · 录像店二楼` + 18 根波形 + `REF F-Ⅲ`）整条删除，`WaveMeter` / `.dshf-rail*` / `.dshf-chip` / `.dshf-meta` / `.dshf-wave*` / `@keyframes dshf-wave-k` / `EYE_SIZE.rail` 一起清掉；唯一保留的是 VOICE 开关，改成 `VoiceCorner` —— 仍挂 dock 座位（拿实时会话 id），但用 `react-dom` 的 portal 渲到 `<body>`，`position:fixed; right:14px; bottom:14px; z-index:10050`（**必须高于**右下角鲸鱼娘挂件的 9999，否则看不见也点不到），dock 行本身不占高度，会话里输入卡片不再被顶一行；`GutterEye` 的锚点改回「卡片顶 - 46 px」（原先靠轨顶，实测同一位置，角落眼不动）；`HeroQuiet` 的 composer 判据去掉轨、只留输入框；补一条 `body:has([role="dialog"]) .dshf-voice-corner{opacity:0;pointer-events:none}`（设置面板这种弹窗打开时角落件让位，不浮在弹窗上）；`test_client.mjs` 改锁「轨的规则不许回来 / VOICE 必须 portal 到 body 且在页面角上 / 开关带 VOICE 文案 / 弹窗打开时让位」，`test_client_mutations.mjs` 加四条变异（portal 拆掉、偏移漂走、轨样式回来、弹窗让位规则失效）全部变红；真页面 1440×900 / 2234×900 / 1280×720 三次实测：轨消失、角上命中 `button.dshf-btn`、点一下关（`voiceAuto=0`）再点一下开、设置面板打开时 `opacity` 1 → 0 → Esc 关掉后回 1、`[data-slot-error]` = 0 ✅ |
| **0.19.0**（最小版，**未定稿**） | **大眼珠子可拖动，默认仍在左下角**（用户：「将 fairy 做成可拖动的，默认位置在左下角」）：`.dshf-corner-plate` 自己当把手 —— `pointer-events:auto` + `cursor:grab` + `border-radius:50%`（只有画出来的圆盘吃指针，方框四角照旧点穿，聊天文字可选可点），子元素全 `pointer-events:none`；拖动只写**相对座位的偏移量**（`dsh-fairy.eyeOffset`，localStorage），座位仍由 `ResizeObserver` 重测，所以侧栏收放 / 输入卡片长高时眼跟着走而偏移不变；`clampEyeOffset()` 夹在窗口内（四边 8 px）；双击归位（清 key）；`is-dragging` 状态（`cursor:grabbing` + 亮度 1.12）；空白会话 hero 阶段 `cursor:default;pointer-events:none`，那颗眼不参与拖动。**已验证**（`scripts/drag_check.mjs`，真页面 1440×900，11 条断言全过）：默认座位 (296,478) → 拖 (+200,+110) 精确落在 (496,588)、`localStorage` = `{"x":200,"y":110}`、刷新后仍在 (496,588)、拖到右下角边停 (1432,892) = 窗口边 -8 px、收起侧栏后随对话列左边缘同步左移 224 px（偏移不变）、双击回 (296,478) 且 key 清空、`elementFromPoint` 圆心 = plate / 方框角 = 聊天节点（**点击穿透仍然成立**）、空白页仍 360×360 居中 1.5 倍且拖动无效；`test_client.mjs` 改锁「plate 吃指针 + grab + 圆盘命中 + 子元素点穿 + 拖动/夹回/归位/hero 让位」，`test_client_mutations.mjs` 十九条全红；**未定稿**：拖动会把那颗圆的范围内（约 200 px 直径）的聊天点击接走，用户可拖回去，是否要更小的把手 / 仅用某个角当把手等定稿意见 |
| ~~0.20.0~~（**已回滚**） | **删掉眼四周的光晕**（用户：「把 fairy 四周的光晕删除」）：皮肤层两条规则把 port 的横向光带场 `.dsh-fairy-halo-layer` 与盘外环形辉光 `.dsh-fairy-outer-halo` 一起 `display:none`，port 与拼接块零改动（`test_client` 的逐字节一致守卫仍绿，上游对照 0/255 不变）；近景对照 `docs/skin-refs/37-fairy-halo-before-020.png` / `38-fairy-halo-after-020.png`。用户看过近景后**回滚**：CSS 规则、两条锁、两条变异、版本号、README 段落全部撤销，只留那两张对照帧与 `scripts/eye_shot.mjs`（不删文件的规矩），运行时代码无残留 |
| **0.21.0**（最小版，**未定稿**） | **会话页光晕范围减半，空白页不动**（用户：「空白会话的fairy不变，非空白会话的fairy光晕范围缩小50%」）：两条规则挂在 `[data-content-phase]:not([data-content-phase="hero"])` 上——`.dsh-fairy-halo-layer` 加 CSS 遮罩（盘缘内全亮，1.4R 处渐隐为 0；`ellipse 18.8% 30.6% at 50% 46.875%`，两轴 142 px），`.dsh-fairy-outer-halo` `scale(.934)`（超出盘缘 10 → 5 viewBox 单位）。**先试过 `transform:scale(.5)`**：0.62 单位的细线缩到 0.45 px 以下，光带直接消失，故改为遮罩。`scripts/halo_profile.mjs` 三张差分的径向亮度剖面实测：超出盘缘 **57.1 px → 27.1 px（47.5%）**；`scripts/eye_shot.mjs --blank` 复核空白页 `mask-image:none`、`transform:none`、光晕盒仍 1131×696（1.5×）；`test_client.mjs` 加四条锁，`test_client_mutations.mjs` 加一条变异（遮罩几何失效，要注意 `-webkit-` 与标准两条声明都得改才真会红）20/20 全过；近景 A/B：`docs/skin-refs/39-fairy-halo-half-ab-021.png`。**未定稿**：超出盘缘的比例可再调（改 `18.8% 30.6%` 两个百分比即可，`scripts/halo_profile.mjs` 直接量） |
| 待定 | 开屏动画（`素材/拓展版HDD开机动画1.mp4`）、白闪/故障撕裂的真 GUI 目视、fp16/fp32 音质 A/B |


## 素材与版权

- 人设参考：米哈游《绝区零》Fairy；台词转写自用户自备剧情音频（`transcripts/`）。
- **Fairy 的眼睛与动作（0.16.0）**：移植自 [Chengzhibense/Fairy-DSH](https://github.com/Chengzhibense/Fairy-DSH)
  的 `fairy-visual/dsh-fairy-visual/src/client/mascot-*.js`（Apache-2.0）。移植清单与唯一偏离
  （id 按实例命名空间化 → 两条「CSS 直写 id」的规则改为实例内联声明；`prefers-reduced-motion`
  同时停 JS 时钟）写在 `client/fairy-mascot.port.js` 的文件头。
- 语音模型：`素材/Fairy/Fairy/`（作者 白菜工厂1145号员工，数据集 红血球AE3803，**严禁商用**）。
- 本仓库仅作个人非营利使用，不包含任何游戏原始资源的分发。

