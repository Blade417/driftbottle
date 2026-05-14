export default function Privacy() {
  return (
    <div className="card prose-on-dark">
      <h1 className="text-3xl font-bold text-white mb-2">隐私政策</h1>
      <p className="text-white/40 text-sm mb-8">最近更新: 2026 年 5 月 14 日</p>

      <Section title="引言">
        我们尊重并保护您的个人信息。本政策说明"漂流瓶日记"如何收集、使用、存储、共享您的个人信息。
        使用本服务前，请仔细阅读本政策。
      </Section>

      <Section title="1. 我们收集哪些信息">
        <ul className="list-disc pl-6 space-y-1">
          <li><b>账号信息</b>：电子邮箱（必填）、用于密码哈希存储的密码。</li>
          <li><b>使用信息</b>：您发布的瓶子内容、回信内容、举报记录。</li>
          <li><b>技术信息</b>：访问 IP（用于限流防滥用）、登录时间。</li>
        </ul>
        <p className="mt-3">
          我们<b>不收集</b>：手机号、真实姓名、身份证号、住址、设备指纹、第三方账号信息。
        </p>
      </Section>

      <Section title="2. 信息如何使用">
        <ul className="list-disc pl-6 space-y-1">
          <li>提供漂流瓶投递、回信、举报等核心服务功能；</li>
          <li>发送邮箱验证码以验证账号有效性；</li>
          <li>对违规内容进行审核与处理；</li>
          <li>统计聚合数据以改进产品（不涉及个人识别）。</li>
        </ul>
      </Section>

      <Section title="3. 信息如何存储">
        <ul className="list-disc pl-6 space-y-1">
          <li>账号密码采用 bcrypt 算法单向哈希存储，平台无法还原。</li>
          <li>用户数据存储于位于中国大陆的服务器，传输与连接均使用 HTTPS 加密。</li>
          <li>数据保留期：账号存续期间持续保留；账号注销后 30 日内完成清除。</li>
        </ul>
      </Section>

      <Section title="4. 信息共享">
        我们<b>不会</b>向任何第三方出售、出租或共享您的个人信息，除以下情形：
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>经您明确同意；</li>
          <li>应法律法规、行政机关、司法机关依法要求；</li>
          <li>为保护用户、平台或公众的合法权益。</li>
        </ul>
        <p className="mt-3">
          平台目前依赖以下第三方服务，仅在必要范围内使用：
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li><b>QQ 邮箱 SMTP</b>：用于发送注册验证码（仅传递邮箱与验证码字符串）。</li>
        </ul>
      </Section>

      <Section title="5. 您的权利">
        您对个人信息享有以下权利：
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li><b>访问</b>：可在"我的瓶子"页面查看自己发布的所有内容。</li>
          <li><b>更正</b>：如发现信息有误，可通过邮件联系我们更正。</li>
          <li><b>删除</b>：发布过的瓶子和回信，可通过邮件申请删除。</li>
          <li><b>账号注销</b>：通过邮件申请注销，30 日内完成数据清除。</li>
        </ul>
      </Section>

      <Section title="6. 匿名性说明">
        本服务设计为<b>对其他用户匿名</b>：
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>瓶子和回信中显示的"头像"由算法根据匿名 seed 生成，不涉及真实身份。</li>
          <li>其他用户<b>无法</b>看到您的邮箱、注册时间、IP 或任何识别信息。</li>
          <li>但平台后台管理员在处理举报时可以查询关联记录；接到执法机关合法要求时也会配合查询。</li>
        </ul>
      </Section>

      <Section title="7. 未成年人保护">
        本服务不面向 14 周岁以下未成年人。如发现未成年人在监护人不知情下注册使用，监护人可通过邮件联系我们删除账号。
      </Section>

      <Section title="8. 政策变更">
        本政策可能因法律法规变化或业务调整而修订。修订后会在本页面发布，重大变更将通过邮件通知。
      </Section>

      <Section title="9. 联系我们">
        如对个人信息处理有任何疑问、投诉或需行使上述权利，请发送邮件至 <span className="text-sky-300">944739287@qq.com</span>。我们将在 15 个工作日内回复。
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
      <div className="text-white/70 leading-relaxed text-sm">{children}</div>
    </section>
  )
}
