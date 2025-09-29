'use strict';
// 自动同步公网 IP 到白名单列表，并清理旧记录

const cr20181201 = require('@alicloud/cr20181201');
const Util = require('@alicloud/tea-util');

const {
  createCrClient,
  getInstanceId,
  getManagedComment,
  getPublicIp,
  formatEntry,
  loadPreviousIp,
  saveCurrentIp,
} = require('./utils');

function normalizeEntry(entryObject) {
  if (!entryObject) {
    return {};
  }
  const entry = entryObject.Entry || entryObject.entry;
  const comment = entryObject.Comment || entryObject.comment;
  return { entry, comment };
}

async function fetchAclEntries(client, instanceId) {
  const request = new cr20181201.GetInstanceEndpointRequest({
    moduleName: 'Registry',
    endpointType: 'internet',
    instanceId: instanceId,
  });
  const runtime = new Util.RuntimeOptions({});
  const resp = await client.getInstanceEndpointWithOptions(request, runtime);
  return (resp.body && Array.isArray(resp.body.AclEntries)) ? resp.body.AclEntries : [];
}

async function addAclEntry(client, instanceId, entry, comment) {
  const request = new cr20181201.CreateInstanceEndpointAclPolicyRequest({
    instanceId: instanceId,
    endpointType: 'internet',
    entry: entry,
    comment: comment,
  });
  const runtime = new Util.RuntimeOptions({});
  return client.createInstanceEndpointAclPolicyWithOptions(request, runtime);
}

async function deleteAclEntry(client, instanceId, entry) {
  const request = new cr20181201.DeleteInstanceEndpointAclPolicyRequest({
    instanceId: instanceId,
    endpointType: 'internet',
    entry: entry,
  });
  const runtime = new Util.RuntimeOptions({});
  return client.deleteInstanceEndpointAclPolicyWithOptions(request, runtime);
}

async function syncAcl() {
  const instanceId = getInstanceId();
  const comment = getManagedComment();
  const publicIp = getPublicIp();
  const currentEntry = formatEntry(publicIp);
  const previousIp = loadPreviousIp();
  const previousEntry = previousIp ? formatEntry(previousIp) : null;

  console.log(`当前公网 IP：${publicIp}`);
  if (previousEntry && previousEntry !== currentEntry) {
    console.log(`上次记录的公网 IP：${previousEntry}`);
  }

  const client = createCrClient();
  const aclEntries = await fetchAclEntries(client, instanceId);
  const normalized = aclEntries.map(normalizeEntry);
  const managedEntries = normalized.filter((item) => item.comment === comment);
  const hasCurrentEntry = normalized.some((item) => item.entry === currentEntry);

  if (hasCurrentEntry) {
    console.log('当前公网 IP 已存在白名单，检查是否需要清理旧记录。');
    const staleEntries = managedEntries.filter((item) => item.entry !== currentEntry);
    for (const stale of staleEntries) {
      try {
        await deleteAclEntry(client, instanceId, stale.entry);
        console.log(`已移除旧白名单记录：${stale.entry}`);
      } catch (error) {
        console.warn(`移除旧白名单记录 ${stale.entry} 失败：${error.message}`);
      }
    }
    saveCurrentIp(publicIp);
    console.log('白名单同步完成，无需新增记录。');
    return;
  }

  if (previousEntry && previousEntry !== currentEntry) {
    try {
      await deleteAclEntry(client, instanceId, previousEntry);
      console.log(`已移除上次记录的白名单 IP：${previousEntry}`);
    } catch (error) {
      console.warn(`移除上次记录的白名单 IP 失败：${error.message}`);
    }
  }

  for (const entry of managedEntries) {
    if (entry.entry === currentEntry) {
      continue;
    }
    try {
      await deleteAclEntry(client, instanceId, entry.entry);
      console.log(`已清理同标签的历史白名单：${entry.entry}`);
    } catch (error) {
      console.warn(`清理历史白名单 ${entry.entry} 失败：${error.message}`);
    }
  }

  const response = await addAclEntry(client, instanceId, currentEntry, comment);
  console.log(`已添加新的白名单：${currentEntry}`);
  console.log(Util.default.toJSONString(response.body));

  saveCurrentIp(publicIp);
  console.log('白名单同步完成。');
}

module.exports.syncAcl = syncAcl;

if (require.main === module) {
  syncAcl().catch((error) => {
    console.error(`同步白名单失败：${error.message}`);
    process.exitCode = 1;
  });
}
