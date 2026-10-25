import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{t}from"./jsx-runtime-MKhVqBIO.js";function n({variant:e=`primary`,type:t=`button`,className:n,...i}){let a=[`btn`,e!==`primary`&&`btn--${e}`,n].filter(Boolean).join(` `);return(0,r.jsx)(`button`,{type:t,className:a,...i})}var r;function i(){return(i=e((()=>{r=t(),n.__docgenInfo={description:`Actions use buttons; navigation uses links. Minimum target 44px.`,methods:[],displayName:`Button`,props:{variant:{required:!1,tsType:{name:`union`,raw:`"primary" | "secondary" | "danger"`,elements:[{name:`literal`,value:`"primary"`},{name:`literal`,value:`"secondary"`},{name:`literal`,value:`"danger"`}]},description:`Visual weight. Use one primary action per view.`,defaultValue:{value:`"primary"`,computed:!1}},type:{defaultValue:{value:`"button"`,computed:!1},required:!1}},composes:[`ButtonHTMLAttributes`]}})))()}var a,o,s,c,l,u,d,f;function p(){return(p=e((()=>{i(),a=t(),o={title:`Components/Button`,component:n,tags:[`autodocs`],parameters:{docs:{description:{component:`Maturity: **Stable**. Actions use buttons; navigation uses links.`}}},args:{children:`Save changes`}},s={},c={args:{variant:`secondary`,children:`Cancel`}},l={args:{variant:`danger`,children:`Delete draft`}},u={args:{disabled:!0,children:`Saving`}},d={render:()=>(0,a.jsxs)(`div`,{style:{display:`flex`,flexWrap:`wrap`,gap:`.6rem`,alignItems:`center`},children:[(0,a.jsx)(n,{children:`Save changes`}),(0,a.jsx)(n,{variant:`secondary`,children:`Cancel`}),(0,a.jsx)(n,{variant:`danger`,children:`Delete draft`}),(0,a.jsx)(n,{disabled:!0,children:`Saving`})]})},f=[`Primary`,`Secondary`,`Danger`,`Disabled`,`AllVariants`],s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "secondary",
    children: "Cancel"
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "danger",
    children: "Delete draft"
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    children: "Saving"
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "flex",
    flexWrap: "wrap",
    gap: ".6rem",
    alignItems: "center"
  }}>
      <Button>Save changes</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="danger">Delete draft</Button>
      <Button disabled>Saving</Button>
    </div>
}`,...d.parameters?.docs?.source}}}})))()}p();export{d as AllVariants,l as Danger,u as Disabled,s as Primary,c as Secondary,f as __namedExportsOrder,o as default};