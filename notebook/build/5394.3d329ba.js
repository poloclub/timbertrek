"use strict";(self.webpackChunk_JUPYTERLAB_CORE_OUTPUT=self.webpackChunk_JUPYTERLAB_CORE_OUTPUT||[]).push([[5394,827],{65394:(e,t,a)=>{a.r(t),a.d(t,{default:()=>i});var l=a(10537),n=a(28861);const s="@jupyterlite/pyolite-kernel-extension:kernel",i=[{id:s,autoStart:!0,requires:[n.IKernelSpecs],activate:(e,t)=>{const n=l.PageConfig.getBaseUrl(),i=JSON.parse(l.PageConfig.getOption("litePluginSettings")||"{}")[s]||{},r=i.pyodideUrl||"https://cdn.jsdelivr.net/pyodide/v0.19.1/full/pyodide.js",p=l.URLExt.parse(r).href,o=(i.pipliteUrls||[]).map((e=>l.URLExt.parse(e).href)),d=!!i.disablePyPIFallback;t.register({spec:{name:"python",display_name:"Pyolite",language:"python",argv:[],spec:{argv:[],env:{},display_name:"Pyolite",language:"python",interrupt_mode:"message",metadata:{}},resources:{"logo-32x32":"TODO","logo-64x64":l.URLExt.join(n,"/kernelspecs/python.png")}},create:async e=>{const{PyoliteKernel:t}=await Promise.all([a.e(4547),a.e(1079)]).then(a.bind(a,41079));return new t({...e,pyodideUrl:p,pipliteUrls:o,disablePyPIFallback:d})}})}}]}}]);
//# sourceMappingURL=5394.3d329ba.js.map