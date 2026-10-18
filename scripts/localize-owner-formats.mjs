import fs from "node:fs";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
const {parse}=require("@babel/parser");
const traverse=require("@babel/traverse").default;
for(const file of ["src/pages/owner/Dashboard.jsx","src/pages/owner/OrderDetailsPage.jsx","src/pages/owner/CustomerDetailsPage.jsx"]) {
  const source=fs.readFileSync(file,"utf8");
  const ast=parse(source,{sourceType:"module",plugins:["jsx"]});
  const edits=[];
  const owners=new Map();
  traverse(ast,{CallExpression(p){
    if(!["formatCurrency","formatDateTimeLabel"].includes(p.node.callee.name))return;
    let fn=p.getFunctionParent();
    while(fn){
      const name=fn.node.id?.name || (fn.parentPath.isVariableDeclarator()?fn.parentPath.node.id.name:"");
      if(/^[A-Z]/.test(name))break;
      fn=fn.getFunctionParent();
    }
    if(!fn)return;
    const field=p.node.callee.name==="formatCurrency"?"currency":"dateTime";
    owners.set(fn.node.start,{node:fn.node,fields:new Set([...(owners.get(fn.node.start)?.fields||[]),field])});
    edits.push({start:p.node.callee.start,end:p.node.callee.end,text:field});
  }});
  for(const {node,fields} of owners.values()) {
    const declaration=node.body.body.find(n=>n.type==="VariableDeclaration"&&n.declarations[0]?.init?.callee?.name==="useOwnerLanguage");
    const pattern=declaration.declarations[0].id;
    edits.push({start:pattern.end-1,end:pattern.end-1,text:", "+[...fields].join(", ")});
  }
  const currencyImport=ast.program.body.find(n=>n.type==="ImportDeclaration"&&n.source.value.endsWith("/formatCurrency.js"));
  if(currencyImport)edits.push({start:currencyImport.start,end:currencyImport.end,text:""});
  if(!file.endsWith("/Dashboard.jsx")) {
    for(const node of ast.program.body) {
      if(node.type==="FunctionDeclaration"&&node.id.name==="formatDateTimeLabel" || node.type==="ImportDeclaration"&&node.source.value.endsWith("/numberFormat.js")) edits.push({start:node.start,end:node.end,text:""});
    }
  }
  let result=source;
  for(const e of edits.sort((a,b)=>b.start-a.start))result=result.slice(0,e.start)+e.text+result.slice(e.end);
  fs.writeFileSync(file,result);
}
