import {Component} from 'react';
import {recoverDeployment} from '../services/deploymentRecovery.js';
export class AppErrorBoundary extends Component {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(error){
  if(/dynamically imported|module script|Loading chunk|ChunkLoadError/i.test(error.message))recoverDeployment({preventDefault(){}},window);
 }
 render(){
  if(this.state.failed)return <main className="auth-loading"><section className="glass-card recovery-panel" role="alert"><h1>No se pudo mostrar esta sección</h1><p>Recarga la aplicación para recuperar la versión actual. Si el problema continúa, revisa la conexión y vuelve a intentarlo. Las operaciones guardadas permanecen en el servidor.</p><button className="button button-primary" onClick={()=>window.location.reload()}>Recargar aplicación</button></section></main>;
  return this.props.children;
 }
}
