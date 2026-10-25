import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g,(_,src)=>{
 const js=fs.readFileSync(path.join(root,src.replace(/^\.\//,'').replace(/^\//,'')),'utf8');
 return '<script type="module">'+js.replaceAll('</script','<\\/script')+'</script>';
});
html=html.replace(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g,(_,src)=>'<style>'+fs.readFileSync(path.join(root,src.replace(/^\.\//,'').replace(/^\//,'')),'utf8')+'</style>');
html=html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/g,'');
if(/(?:src|href)="(?:\.\/)?assets\//.test(html))throw Error('Unbundled runtime asset remains');
fs.writeFileSync(path.join(root,'Predel.html'),html);
console.log('Standalone game:',path.join(root,'Predel.html'),Buffer.byteLength(html),'bytes');
