# 为实例访问入口（限公网）创建白名单策略完整工程示例

该项目为CreateInstanceEndpointAclPolicy的完整工程示例。

该示例**无法在线调试**，如需调试可下载到本地后替换 [AK](https://usercenter.console.aliyun.com/#/manage/ak) 以及参数后进行调试。

## 运行条件

- 下载并解压需要语言的代码;


- 在阿里云帐户中获取您的 [凭证](https://usercenter.console.aliyun.com/#/manage/ak) 并通过默认凭据链进行配置（建议通过环境变量或 `~/.alibabacloud/credentials` 管理凭据，而非写入代码);

- 执行对应语言的构建及运行语句

## 执行步骤

下载的代码包，在根据自己需要更改代码中的参数和 AK 以后，可以在**解压代码所在目录下**按如下的步骤执行：

- *Node.js >= 8.x*
```sh
npm install --registry=https://registry.npmmirror.com
```

## 环境变量说明

- `ALIBABA_CLOUD_CR_INSTANCE_ID`：目标容器镜像实例 ID，脚本运行前必须设置。
- `ALIBABA_CLOUD_CR_COMMENT`：可选，白名单条目的备注标记（默认值为 `auto-managed-ip`）。
- `ALIBABA_CLOUD_CR_STATE_FILE`：可选，用于记录上次同步公网 IP 的状态文件路径，默认写入项目根目录的 `.last_acl_ip`。
- `ALIBABA_CLOUD_CR_DELETE_ENTRY`：可选，删除脚本的默认 Entry 值。

## 常用脚本

- 查询当前白名单
  ```sh
  node src/getinfo.js
  ```
- 手动添加当前公网 IP 至白名单
  ```sh
  node src/client.js
  ```
- 手动删除白名单条目（支持传入 IP 或完整 Entry）
  ```sh
  node src/deleteip.js 1.2.3.4
  # 或
  node src/deleteip.js 1.2.3.4/32
  ```
- 自动同步公网 IP（变更时新增新 IP 并移除旧 IP）
  ```sh
  node src/syncAcl.js
  ```
## 使用的 API

-  CreateInstanceEndpointAclPolicy：为实例访问入口（限公网）创建白名单策略。 更多信息可参考：[文档](https://next.api.aliyun.com/document/cr/2018-12-01/CreateInstanceEndpointAclPolicy)

## API 返回示例

*实际输出结构可能稍有不同，属于正常返回；下列输出值仅作为参考，以实际调用为准*


- JSON 格式 
```js
{
  "Code": "success",
  "IsSuccess": true,
  "RequestId": "xx-4x6-4x8-x-3xxx"
}
```
