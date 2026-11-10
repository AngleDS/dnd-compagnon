/* ---------- adaptateur de plateforme ---------- */
/* Le reste de l'application ne dépend jamais directement de l'API Claude. */
const PLATFORM={
  bridge:null,user:null,db:null,ai:null,browser:null,initialized:false,
  async init(){
    if(this.initialized) return this;
    this.initialized=true;
    const bridge=window.claude;
    if(!bridge||typeof bridge.use!=="function") return this;
    this.bridge=bridge;
    const use=async name=>{ try{ return await bridge.use(name); }catch(e){ return null; } };
    [this.user,this.db,this.ai,this.browser]=await Promise.all([use("user"),use("db"),use("sample"),use("mcp")]);
    return this;
  },
  get hasAI(){ return !!(this.ai&&typeof this.ai.json==="function"); },
  get hasBrowser(){ return !!(this.browser&&typeof this.browser.callTool==="function"); },
  aiJson(prompt,options){ if(!this.hasAI) return Promise.reject({code:"sampling_disabled"}); return this.ai.json(prompt,options); },
  browserCall(tool,input){ if(!this.hasBrowser) return Promise.reject({code:"server_not_connected"}); return this.browser.callTool("host:claude_browser",tool,input); },
  async download(filename,data){
    if(!this.bridge) return false;
    try{ const dl=await this.bridge.use("downloads"); if(!dl||typeof dl.save!=="function") return false; await dl.save({filename,data}); return true; }
    catch(e){ return false; }
  }
};
