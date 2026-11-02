(function () {
  'use strict';
  var W = window;
  var D = document;

  // 界面提示
  D.body.innerHTML = "<div style='text-align:center;margin-top:50px;font-size:20px;color:#0f766e;font-family:sans-serif;'>自动化采集中...<br><br><span style='font-size:14px;color:#666;'>请稍候</span></div>";

  // 从当前引用的 script 标签 URL 中提取 id
  var itemId = "";
  try {
    var scriptSrc = D.currentScript.src;
    var urlParams = new URLSearchParams(scriptSrc.split('?')[1]);
    itemId = urlParams.get('id');
  } catch (e) {
    itemId = "未获取到ID";
  }

  if (!itemId) {
    D.body.innerHTML = "<h2 style='text-align:center;color:red;'>未收到商品 ID</h2>";
    return;
  }

  function mtopSend(api, param) {
    return new Promise(function (resolve, reject) {
      if (!W.__windvane__ || !W.__windvane__.call) {
        reject('no bridge'); return;
      }
      var p = { api: api, v: '1.0', post: '1', type: '', isHttps: '0', ecode: '0',
        isSec: '0', param: param, timer: 30000, needLogin: true, 
        sessionOption: 'AutoLoginOnly', ext_headers: {}, ext_querys: {} };
      W.__windvane__.call('MtopWVPlugin.send', p, resolve, reject, 10000);
    });
  }

  function buildDetailParam(itemId) {
    var ex = { NAV_PROCESSOR_START_TIME: "1761720138804", appReqFrom: "detail", bizName: "minidetail", 
      container_type: "sku", countryCode: "CN", cpuCore: "8", deviceLevel: "medium", 
      dinamic_v3: "true", from: "minidetail", itemId: itemId, item_id: itemId, 
      newStruct: "true", osVersion: "34", phoneType: "OPPO11", screenHeight: "2606", 
      screenWidth: "1240", skuOutSdk: "true", skuType: "confirm", sourceType: "3",
      ttd_ttid: "10001201@tt_detail_android_12.51.40", ultron2: "true", utdid: "b5eAIejvgwsCAbRmgzU4VyYm" };
    return { detail_v: "3.3.2", exParams: JSON.stringify(ex), id: itemId };
  }

  mtopSend('mtop.taobao.detail.data.get', buildDetailParam(itemId)).then(function (res) {
    // 通过特殊的 log 标记，让电脑端通过 adb logcat 截获
    console.log("TASK_DATA_START::" + JSON.stringify(res) + "::TASK_DATA_END");
    D.body.innerHTML = "<div style='text-align:center;margin-top:50px;font-size:20px;color:green;'>采集成功<br>可关闭此页面</div>";
  }).catch(function (err) {
    console.log("TASK_ERROR::" + JSON.stringify(err));
    D.body.innerHTML = "<div style='text-align:center;margin-top:50px;font-size:20px;color:red;'>采集失败：" + JSON.stringify(err) + "</div>";
  });
})();