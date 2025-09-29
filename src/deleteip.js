'use strict';
// 依赖的模块可通过下载工程中的模块依赖文件或右上角的获取 SDK 依赖信息查看
const cr20181201 = require('@alicloud/cr20181201');
const Util = require('@alicloud/tea-util');

const {
  createCrClient,
  getInstanceId,
  formatEntry,
  isValidIPv4,
  loadPreviousIp,
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

  static resolveEntry(args) {
    const direct = args && args[0] ? args[0].trim() : undefined;
    const envEntry = process.env.ALIBABA_CLOUD_CR_DELETE_ENTRY;
    const candidate = direct || envEntry;
    if (candidate && candidate.includes('/')) {
      return candidate;
    }
    if (candidate && isValidIPv4(candidate)) {
      return formatEntry(candidate);
    }
    const historyIp = loadPreviousIp();
    if (historyIp) {
      return formatEntry(historyIp);
    }
    throw new Error('缺少待删除的 IP / Entry，请通过命令行参数、环境变量 ALIBABA_CLOUD_CR_DELETE_ENTRY 或运行同步脚本生成记录。');
  }

  static async main(args) {
    const instanceId = getInstanceId();
    const entry = Client.resolveEntry(args);
    const client = Client.createClient();
    const request = new cr20181201.DeleteInstanceEndpointAclPolicyRequest({
      instanceId: instanceId,
      endpointType: 'internet',
      entry: entry,
    });
    const runtime = new Util.RuntimeOptions({});

    try {
      const resp = await client.deleteInstanceEndpointAclPolicyWithOptions(request, runtime);
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
    console.error(`移除白名单失败：${error.message}`);
    process.exitCode = 1;
  });
}
