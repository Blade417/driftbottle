export default function Terms() {
  return (
    <div className="card prose-on-dark">
      <h1 className="text-3xl font-bold text-white mb-2">用户协议</h1>
      <p className="text-white/40 text-sm mb-8">最近更新: 2026 年 5 月 14 日</p>

      <Section title="1. 接受条款">
        欢迎使用"漂流瓶日记"(以下简称"本服务")。在使用本服务前，请仔细阅读本协议。
        当您完成注册、登录或以任何方式使用本服务，即视为您已阅读、理解并接受本协议全部条款。
        若您不同意任何条款，请立即停止使用本服务。
      </Section>

      <Section title="2. 服务说明">
        本服务是一个匿名漂流瓶通信平台，允许注册用户：
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>撰写匿名文字内容（"漂流瓶"），由系统随机投递给其他用户；</li>
          <li>随机捡到其他用户投递的漂流瓶，并与之进行匿名一对一通信；</li>
          <li>对违规内容进行举报。</li>
        </ul>
      </Section>

      <Section title="3. 账号注册与使用">
        <ul className="list-disc pl-6 space-y-1">
          <li>注册需提供真实有效的电子邮箱并通过验证。</li>
          <li>您应妥善保管账号与密码。因您自身原因（如密码泄露、转借他人）造成的损失由您本人承担。</li>
          <li>如发现账号被盗用，请立即联系平台并修改密码。</li>
          <li>未满 14 周岁的未成年人禁止使用本服务。14-18 周岁未成年人应在监护人指导下使用。</li>
        </ul>
      </Section>

      <Section title="4. 用户行为规范">
        您承诺在使用本服务过程中不发布、不传播下列内容：
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>违反宪法、法律法规、损害国家利益及社会公共利益的内容；</li>
          <li>色情、淫秽、暴力、血腥、恐怖、赌博类内容；</li>
          <li>侮辱、诽谤、骚扰、威胁他人，或侵犯他人合法权益的内容；</li>
          <li>商业广告、营销引流、传销、非法集资类信息；</li>
          <li>涉及个人隐私（包括但不限于姓名、电话、住址、身份证号、银行卡号）的内容；</li>
          <li>其他违反法律法规或公序良俗的内容。</li>
        </ul>
        <p className="mt-3">
          您应对发布的内容承担全部法律责任。平台保留对违规内容下架、限制账号功能、封禁账号的权利。
        </p>
      </Section>

      <Section title="5. 内容审核">
        平台对用户发布的内容进行人工与机器结合的审核。
        平台有权但无义务对内容进行事前审查，并保留在事后发现违规内容时进行下架、删除的权利。
      </Section>

      <Section title="6. 知识产权">
        您发布在本服务的内容，所有权归您所有。
        您同意授予本平台在全球范围内、免费、非独占地存储、展示、复制、修改（仅限内容审核与展示所必须的最小范围）该内容的权利，期限为账号存续期间。
      </Section>

      <Section title="7. 服务变更与终止">
        平台有权根据自身经营情况、法律法规变化、不可抗力等原因，对服务进行变更、暂停或终止，并将以站内公告或邮件方式通知用户。
      </Section>

      <Section title="8. 免责声明">
        <ul className="list-disc pl-6 space-y-1">
          <li>本服务以"现状"提供，不对服务的可用性、连续性、准确性作任何明示或默示担保。</li>
          <li>对于用户之间通过本服务进行通信所产生的纠纷，平台不承担连带责任。</li>
          <li>因不可抗力（包括但不限于自然灾害、网络中断、政府行为）导致的服务中断或数据丢失，平台不承担责任。</li>
        </ul>
      </Section>

      <Section title="9. 协议变更">
        平台有权根据法律法规变化或业务调整对本协议进行修改。修改后的协议将在本页面公布，自公布之日起生效。
        若您继续使用本服务，视为接受变更后的协议。
      </Section>

      <Section title="10. 联系方式">
        如对本协议有任何疑问、建议或投诉，请发送邮件至 <span className="text-sky-300">944739287@qq.com</span>。
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
