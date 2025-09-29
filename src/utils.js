'use strict';

const cr20181201 = require('@alicloud/cr20181201');
const OpenApi = require('@alicloud/openapi-client');
const Credential = require('@alicloud/credentials');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let credentialClient;

function getCredentialClient() {
  if (!credentialClient) {
    credentialClient = new Credential.default();
  }
  return credentialClient;
}

function createCrClient() {
  const config = new OpenApi.Config({
    credential: getCredentialClient(),
  });
  config.endpoint = process.env.ALIBABA_CLOUD_CR_ENDPOINT || 'cr.cn-hangzhou.aliyuncs.com';
  return new cr20181201.default(config);
}

function getInstanceId() {
  const instanceId = process.env.ALIBABA_CLOUD_CR_INSTANCE_ID;
  if (!instanceId) {
    throw new Error('缺少环境变量 ALIBABA_CLOUD_CR_INSTANCE_ID，请先配置目标实例 ID。');
  }
  return instanceId;
}

function getManagedComment() {
  return process.env.ALIBABA_CLOUD_CR_COMMENT || 'auto-managed-ip';
}

function isValidIPv4(ip) {
  if (!ip) {
    return false;
  }
  const ipv4RegExp = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  return ipv4RegExp.test(ip.trim());
}

function runCommand(command) {
  try {
    const output = execSync(command, { encoding: 'utf8' }).trim();
    return output || null;
  } catch (error) {
    return null;
  }
}

function getPublicIp() {
  const candidates = [
    'curl -s ifconfig.me',
    "curl -s cip.cc | grep IP | awk '{print $3}'",
  ];
  for (const command of candidates) {
    const result = runCommand(command);
    if (isValidIPv4(result)) {
      return result.trim();
    }
  }
  throw new Error('无法获取公网 IP，请检查网络连通性并确认已安装 curl。');
}

function formatEntry(ip) {
  return `${ip}/32`;
}

function getStateFilePath() {
  return process.env.ALIBABA_CLOUD_CR_STATE_FILE || path.resolve(__dirname, '..', '.last_acl_ip');
}

function loadPreviousIp() {
  const stateFile = getStateFilePath();
  try {
    const data = fs.readFileSync(stateFile, 'utf8').trim();
    if (isValidIPv4(data)) {
      return data;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`读取历史 IP 失败：${error.message}`);
    }
  }
  return null;
}

function saveCurrentIp(ip) {
  const stateFile = getStateFilePath();
  const stateDir = path.dirname(stateFile);
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(stateFile, `${ip}\n`, 'utf8');
}

module.exports = {
  createCrClient,
  getCredentialClient,
  getInstanceId,
  getManagedComment,
  getPublicIp,
  formatEntry,
  loadPreviousIp,
  saveCurrentIp,
  isValidIPv4,
  getStateFilePath,
};
