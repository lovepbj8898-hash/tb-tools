(function () {
  'use strict';

  // 替换掉淘宝原本的界面
  document.body.innerHTML = "<div style='text-align:center;margin-top:100px;font-family:sans-serif;'><h2 style='color:#0f766e;'>正在搜索并采集...</h2><p id='status' style='color:#666;'>请稍候</p></div>";
  var statusEl = document.getElementById('status');

  // 1. 从深链中获取电脑端传来的商品ID和标题
  function getQueryParam(name) {
    var match = location.href.match(new RegExp('[?&]' + name + '=([^&]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }

  var targetId = getQueryParam('id');
  var keyword = getQueryParam('kw'); // 商品标题

  if (!targetId) {
    statusEl.innerText = "未收到商品 ID";
    return;
  }

  // 2. 淘宝原生桥接请求封装
  function mtopSend(api, param) {
    return new Promise(function (resolve, reject) {
      if (!window.__windvane__ || !window.__windvane__.call) {
        reject('no bridge'); return;
      }
      var p = { api: api, v: '1.0', post: '1', type: '', isHttps: '0', ecode: '0',
        isSec: '0', param: param, timer: 30000, needLogin: true, 
        sessionOption: 'AutoLoginOnly', ext_headers: {}, ext_querys: {} };
      window.__windvane__.call('MtopWVPlugin.send', p, resolve, reject, 10000);
    });
  }

  // 3. 第一步：文搜请求
  function runSearch() {
    statusEl.innerText = "正在通过文搜查找商品...";
    var searchParam = {
      q: keyword,
      appId: '66',
      sversion: '29.9',
      spm: 'a2141.1.searchbar.searchbox',
      scm: '1007.home_topbar.searchbox.d',
      search_action: 'initiative',
      from: 'nt_history',
      sugg: '_0_1',
      index: '0',
      vm: 'nw',
      schemaType: 'auction',
      style: 'list',
      needTabs: 'true',
      tb2025: 'true',
      gpsEnabled: 'false'
    };

    mtopSend('mtop.relationrecommend.MtopRecommend.recommend', searchParam).then(function(res) {
      // 4. 第二步：从文搜结果里提取目标ID，如果没找到目标ID，就直接拿文搜结果
      // 这里我们直接进行详情请求
      runDetail(targetId);
    }).catch(function(err) {
      statusEl.innerText = "文搜失败，尝试直接请求详情...";
      runDetail(targetId);
    });
  }

  // 5. 拉取详情数据
  function runDetail(itemId) {
    statusEl.innerText = "正在拉取详情数据...";
    var ex = { NAV_PROCESSOR_START_TIME: "1761720138804", appReqFrom: "detail", bizName: "minidetail", 
      container_type: "sku", from: "minidetail", itemId: itemId, item_id: itemId, 
      newStruct: "true", osVersion: "34", phoneType: "OPPO11", sourceType: "3",
      ttd_ttid: "10001201@tt_detail_android_12.51.40" };
    var param = { detail_v: "3.3.2", exParams: JSON.stringify(ex), id: itemId };

    mtopSend('mtop.taobao.detail.data.get', param).then(function(res) {
      statusEl.innerText = "采集成功！";
      statusEl.style.color = "green";
      // 打印特殊标记，让电脑端通过 adb logcat 抓取
      console.log("TASK_DATA_START::" + JSON.stringify(res) + "::TASK_DATA_END");
    }).catch(function(err) {
      statusEl.innerText = "详情拉取失败";
      statusEl.style.color = "red";
      console.log("TASK_ERROR::" + JSON.stringify(err));
    });
  }

  // 启动流程
  runSearch();
})();
