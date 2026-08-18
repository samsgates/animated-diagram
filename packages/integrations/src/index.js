import { buildDiagram } from "@animted-diagram/core";

export function defineAnimatedDiagramElement(tagName="animated-diagram") {
  if(typeof customElements==="undefined"||customElements.get(tagName)) return;
  class AnimatedDiagramElement extends HTMLElement {
    static get observedAttributes(){return ["spec","preset","scenario"];}
    #spec=null;
    set specification(value){this.#spec=value;this.render();}
    get specification(){return this.#spec;}
    connectedCallback(){this.render();}
    attributeChangedCallback(){this.render();}
    render(){
      let spec=this.#spec;
      if(!spec&&this.getAttribute("spec")){
        try{spec=JSON.parse(this.getAttribute("spec"));}catch{return;}
      }
      if(!spec){
        const data=this.querySelector('script[type="application/json"]');
        if(data){try{spec=JSON.parse(data.textContent);}catch{return;}}
      }
      if(!spec)return;
      const {html}=buildDiagram(spec,{preset:this.getAttribute("preset")||undefined,scenario:this.getAttribute("scenario")||undefined});
      if(!this.shadowRoot)this.attachShadow({mode:"open"});
      this.shadowRoot.innerHTML=`<style>:host{display:block}iframe{width:100%;min-height:620px;border:0}</style><iframe title="${String(spec.title||"Animated diagram").replaceAll('"',"&quot;")}" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe>`;
      this.shadowRoot.querySelector("iframe").srcdoc=html;
    }
  }
  customElements.define(tagName,AnimatedDiagramElement);
}

export function createReactAnimatedDiagram(React) {
  if(!React?.createElement) throw new Error("Pass the React module/object to createReactAnimatedDiagram().");
  return function AnimatedDiagram({spec,options={},title,style,className}) {
    const {html}=buildDiagram(spec,options);
    return React.createElement("iframe",{
      title:title||spec?.title||"Animated diagram",srcDoc:html,className,style:{width:"100%",minHeight:620,border:0,...style},
      sandbox:"allow-scripts",referrerPolicy:"no-referrer"
    });
  };
}

export function createVueAnimatedDiagram(Vue) {
  if(!Vue?.defineComponent||!Vue?.h) throw new Error("Pass Vue to createVueAnimatedDiagram().");
  return Vue.defineComponent({
    name:"AnimatedDiagram",
    props:{spec:{type:Object,required:true},options:{type:Object,default:()=>({})},title:{type:String,default:""}},
    setup(props){return()=>{const {html}=buildDiagram(props.spec,props.options);return Vue.h("iframe",{title:props.title||props.spec?.title||"Animated diagram",srcdoc:html,sandbox:"allow-scripts",referrerpolicy:"no-referrer",style:"width:100%;min-height:620px;border:0"});};}
  });
}
