'use strict';
// 依赖的模块可通过下载工程中的模块依赖文件或右上角的获取 SDK 依赖信息查看
const cr20181201 = require('@alicloud/cr20181201');
const Util = require('@alicloud/tea-util');

const {
  createCrClient,
  getInstanceId,
} = require('./utils');

class Client {

  /**
   * 使用凭据初始化账号 Client
   * @return Client
   * @throws Exception
   */
  static createClient() {
    // 工程代码建议使用更安全的无 AK 方式，凭据配置方式请参见：https://help.aliyun.com/document_detail/378664.html。
    return createCrClient();
  }

  static async main(args) {
    const instanceId = getInstanceId();
    const client = Client.createClient();
    const request = new cr20181201.GetInstanceEndpointRequest({
      moduleName: 'Registry',
      endpointType: 'internet',
      instanceId: instanceId,
    });
    const runtime = new Util.RuntimeOptions({});

    try {
      const resp = await client.getInstanceEndpointWithOptions(request, runtime);
      console.log(Util.default.toJSONString(resp.body));
    } catch (error) {
      console.log(error.message);
      if (error.data && error.data["Recommend"]) {
        console.log(error.data["Recommend"]);
      }
      Util.default.assertAsString(error.message);
      throw error;
    }
  }

}

module.exports.Client = Client;

if (require.main === module) {
  Client.main(process.argv.slice(2)).catch((error) => {
    console.error(`查询白名单失败：${error.message}`);
    process.exitCode = 1;
  });
}
