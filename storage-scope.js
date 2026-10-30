/* 每个独立版本使用自己的存储前缀，保留旧演示数据。 */
const DEMO_VERSION = document.querySelector('meta[name="teacher-demo-version"]')?.content
 || (decodeURIComponent(location.pathname).match(/\/(V\d+\.\d+\.\d+)[^/]*\//)||[])[1] || "V1.2.4";
const demoStorage = {
 getItem(key) { return localStorage.getItem(`teacher-demo:${DEMO_VERSION}:${key}`); },
 setItem(key,value) { localStorage.setItem(`teacher-demo:${DEMO_VERSION}:${key}`,String(value)); },
 removeItem(key) { localStorage.removeItem(`teacher-demo:${DEMO_VERSION}:${key}`); }
};
window.DEMO_VERSION=DEMO_VERSION;
