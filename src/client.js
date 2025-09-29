'use strict';
// 依赖的模块可通过下载工程中的模块依赖文件或右上角的获取 SDK 依赖信息查看
const cr20181201 = require('@alicloud/cr20181201');
const Console = require('@alicloud/tea-console');
const Util = require('@alicloud/tea-util');

const {
  createCrClient,
  getInstanceId,
  getManagedComment,
  getPublicIp,
  formatEntry,
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
    const comment = getManagedComment();
    const publicIp = getPublicIp();
    const entry = formatEntry(publicIp);

    const client = Client.createClient();
    const createInstanceEndpointAclPolicyRequest = new cr20181201.CreateInstanceEndpointAclPolicyRequest({
      instanceId: instanceId,
      endpointType: 'internet',
      entry: entry,
      comment: comment,
    });
    const runtime = new Util.RuntimeOptions({});

    try {
      const resp = await client.createInstanceEndpointAclPolicyWithOptions(createInstanceEndpointAclPolicyRequest, runtime);
      Console.default.log(Util.default.toJSONString(resp));
    } catch (error) {
      // 此处仅做打印展示，请谨慎对待异常处理，在工程项目中切勿直接忽略异常。
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
    console.error(`添加白名单失败：${error.message}`);
    process.exitCode = 1;
  });
}
