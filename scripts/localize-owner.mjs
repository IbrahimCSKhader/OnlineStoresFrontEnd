import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const arabic = /[\u0600-\u06ff]/;
const files = [...["src/pages/owner", "src/components/dashboard"].flatMap(dir => fs.readdirSync(dir).filter(f=>f.endsWith(".jsx")).map(f=>path.join(dir,f))), "src/components/layout/DashboardSidebar.jsx", "src/components/layout/Footer.jsx", "src/components/common/tables/AppDataTable.jsx"];
const phrases = new Set();
for (const file of files) {
  const source = fs.readFileSync(file,"utf8");
  const ast = parse(source,{sourceType:"module",plugins:["jsx"]});
  const edits = [];
  const components = new Map();
  function componentFor(nodePath) {
    let current = nodePath;
    while (current) {
      if (current.isFunction()) {
        const name = current.node.id?.name || (current.parentPath.isVariableDeclarator() ? current.parentPath.node.id.name : "");
        if (/^[A-Z]/.test(name) && current.node.body.type === "BlockStatement") return current;
      }
      current = current.parentPath;
    }
    return null;
  }
  function translate(nodePath, replacement) {
    const component = componentFor(nodePath);
    if (!component) return;
    components.set(component.node.start,component.node);
    edits.push({start:nodePath.node.start,end:nodePath.node.end,text:replacement});
  }
  traverse(ast,{
    StringLiteral(p) { if (arabic.test(p.node.value)) phrases.add(p.node.value.trim()); },
    JSXText(p) {
      if (!arabic.test(p.node.value)) return;
      const value = p.node.value.replace(/\s+/g," ").trim();
      phrases.add(value);
      translate(p,`{t(${JSON.stringify(value)})}`);
    },
    JSXAttribute(p) {
      if (!["label","title","placeholder","description","helperText","aria-label","alt"].includes(p.node.name.name)) return;
      if (p.node.value?.type === "StringLiteral" && arabic.test(p.node.value.value)) translate(p.get("value"),`{t(${JSON.stringify(p.node.value.value)})}`);
    },
    JSXExpressionContainer: {
      exit(p) {
        if (p.parentPath.isJSXAttribute() && !["label","title","placeholder","description","helperText","aria-label","alt"].includes(p.parentPath.node.name.name)) return;
        const exp=p.node.expression;
        if (["JSXEmptyExpression","JSXElement","JSXFragment","ArrowFunctionExpression"].includes(exp.type)) return;
        if (edits.some(e=>e.start>p.node.start && e.end<p.node.end)) return;
        translate(p,`{t(${source.slice(exp.start,exp.end)})}`);
      }
    }
  });
  if (!components.size || source.includes('import useOwnerLanguage ')) continue;
  for (const component of components.values()) edits.push({start:component.body.start+1,end:component.body.start+1,text:"\n  const { t } = useOwnerLanguage();"});
  const relative=path.relative(path.dirname(file),"src/hooks/storefront/useOwnerLanguage.js").replaceAll("\\","/");
  edits.push({start:0,end:0,text:`import useOwnerLanguage from ${JSON.stringify(relative.startsWith('.')?relative:'./'+relative)};\n`});
  let result=source;
  for (const edit of edits.sort((a,b)=>b.start-a.start)) result=result.slice(0,edit.start)+edit.text+result.slice(edit.end);
  fs.writeFileSync(file,result);
}
fs.mkdirSync("artifacts",{recursive:true});
fs.writeFileSync("artifacts/owner-phrases.json",JSON.stringify([...phrases].sort(),null,2));
console.log(`${phrases.size} owner phrases collected; owner JSX localized.`);
