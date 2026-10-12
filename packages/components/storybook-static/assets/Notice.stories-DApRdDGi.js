import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./jsx-runtime-DeHZSEgm.js";function n({tone:e=`info`,heading:t,children:n}){return(0,r.jsxs)(`div`,{className:`notice${e===`info`?``:` notice--${e}`}`,role:e===`danger`?`alert`:`note`,children:[(0,r.jsx)(`b`,{className:`notice__heading`,children:t}),n]})}var r;function i(){return(i=e((()=>{r=t(),n.__docgenInfo={description:`Four tones. Danger notices are announced immediately; the rest are read in order.`,methods:[],displayName:`Notice`,props:{tone:{required:!1,tsType:{name:`union`,raw:`"info" | "warn" | "danger" | "success"`,elements:[{name:`literal`,value:`"info"`},{name:`literal`,value:`"warn"`},{name:`literal`,value:`"danger"`},{name:`literal`,value:`"success"`}]},description:``,defaultValue:{value:`"info"`,computed:!1}},heading:{required:!0,tsType:{name:`string`},description:`Required: colour is never the only signal.`},children:{required:!0,tsType:{name:`ReactNode`},description:``}}}})))()}var a,o,s,c,l,u,d;function f(){return(f=e((()=>{i(),a={title:`Components/Notice`,component:n,tags:[`autodocs`],parameters:{docs:{description:{component:`Maturity: **Stable**. Four tones; every notice has a heading.`}}},args:{heading:`Note`,children:`The next update is due on the hour.`}},o={},s={args:{tone:`warn`,heading:`Provisional data`}},c={args:{tone:`danger`,heading:`Could not load`}},l={args:{tone:`success`,heading:`Published`}},u={args:{children:`A deliberately long headline that checks whether the layout stays readable when real writing gets in the way. A deliberately long headline that checks whether the layout stays readable when real writing gets in the way.`}},d=[`Info`,`Warn`,`Danger`,`Success`,`LongText`],o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    tone: "warn",
    heading: "Provisional data"
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    tone: "danger",
    heading: "Could not load"
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    tone: "success",
    heading: "Published"
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    children: "A deliberately long headline that checks whether the layout stays readable when real writing gets in the way. A deliberately long headline that checks whether the layout stays readable when real writing gets in the way."
  }
}`,...u.parameters?.docs?.source}}}})))()}f();export{c as Danger,o as Info,u as LongText,l as Success,s as Warn,d as __namedExportsOrder,a as default};