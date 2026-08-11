export function parseUrlParams(url) {
  if(!url){
    return
  }
  if(url&&url.indexOf('?')===-1){
    return
  }
  let params = {};
  let urlParams = url.split('?')[1].split('&');
  urlParams.forEach(item => {
    let key = item.split('=')[0];
    let value = item.split('=')[1];
    params[key] = value;
  });
  return params;
}
