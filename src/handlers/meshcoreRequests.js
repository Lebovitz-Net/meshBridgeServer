// src/handlers/meshcoreRequests.js

import { MeshcoreCommandQueue } from '../MeshCore/meshcoreCommandQueue.js';
import { EventEmitter } from 'events';

import { encode } from '../MeshCore/packetEncoder.js';

let meshcoreRuntime = null;
``
/**
 * Bind the active MeshCore transport runtime
 * @param {object} runtime - MeshCore handler with .send(packet)
 */
export function bindMeshRuntime(runtime) {
  meshcoreRuntime = runtime;
}

export const getMeshRuntime = () => meshcoreRuntime;

// meshcoreRequests.js
export class MeshcoreRequests extends EventEmitter {
  constructor(handler, interval) {
    super();
    this.connection = handler.connection;
    this.queue = new MeshcoreCommandQueue(handler, interval);

    if (!MeshcoreRequests.instance) {
      MeshcoreRequests.instance = this;
    }
  }
  
  static getInstance() {
    return MeshcoreRequests.instance;
  }
  // --- High-level API calls mirrored from connection.js ---

  async getSelfInfo(timeoutMillis = null) {
    return this.queue.send(() => this.connection.getSelfInfo(timeoutMillis));
  }

  async sendAdvert(type) {
    return this.queue.send(() => this.connection.sendAdvert(type));
  }

  async sendFloodAdvert() {
    return this.queue.send(() => this.connection.sendFloodAdvert());
  }

  async sendZeroHopAdvert() {
    return this.queue.send(() => this.connection.sendZeroHopAdvert());
  }

  async setAdvertName(name) {
    return this.queue.send(() => this.connection.setAdvertName(name));
  }

  async setAdvertLatLong(latitude, longitude) {
    return this.queue.send(() => this.connection.setAdvertLatLong(latitude, longitude));
  }

  async setTxPower(txPower) {
    return this.queue.send(() => this.connection.setTxPower(txPower));
  }

  // --- Message-related APIs ---
  async sendMessage(txtType, attempt, senderTimestamp, pubKeyPrefix, text) {
    return this.queue.send(() =>
      this.connection.sendMessage(txtType, attempt, senderTimestamp, pubKeyPrefix, text)
    );
  }

  async sendChannelMessage(txtType, channelIdx, senderTimestamp, text) {
    return this.queue.send(() =>
      this.connection.sendChannelMessage(txtType, channelIdx, senderTimestamp, text)
    );
  }

  async sendChannelTextMessage(channelIdx, text) {
    return this.queue.send(() => this.connection.sendChannelTextMessage(channelIdx, text));
  }

  async syncNextMessage() {
    return this.queue.send(() => this.connection.syncNextMessage());
  }

  async getWaitingMessages() {
      return this.queue.send(() => this.connection.getWaitingMessages());
  }

  // --- Contacts ---
  async getContacts(since = null) {
    return this.queue.send(() => this.connection.getContacts(since));
  }

  async addOrUpdateContact(publicKey, type, flags, outPathLen, outPath, advName, lastAdvert, advLat, advLon) {
    return this.queue.send(() =>
      this.connection.addOrUpdateContact(publicKey, type, flags, outPathLen, outPath, advName, lastAdvert, advLat, advLon)
    );
  }

  async removeContact(pubKey) {
    return this.queue.send(() => this.connection.removeContact(pubKey));
  }

  async shareContact(pubKey) {
    return this.queue.send(() => this.connection.shareContact(pubKey));
  }

  async exportContact(pubKey = null) {
    return this.queue.send(() => this.connection.exportContact(pubKey));
  }

  async importContact(advertPacketBytes) {
    return this.queue.send(() => this.connection.importContact(advertPacketBytes));
  }

  // --- Channels ---
  async getChannel(channelIdx) {
    return this.queue.send(() => this.connection.getChannel(channelIdx));
  }

  async setChannel(channelIdx, name, secret) {
    return this.queue.send(() => this.connection.setChannel(channelIdx, name, secret));
  }

  async getChannels() {
    return this.queue.send(() => this.connection.getChannels());
  }

  // --- Device / Radio ---
  async setRadioParams(radioFreq, radioBw, radioSf, radioCr) {
    return this.queue.send(() => this.connection.setRadioParams(radioFreq, radioBw, radioSf, radioCr));
  }

  async getDeviceTime() {
    return this.queue.send(() => this.connection.getDeviceTime());
  }

  async setDeviceTime(epochSecs) {
    return this.queue.send(() => this.connection.setDeviceTime(epochSecs));
  }

  async getBatteryVoltage() {
    return this.queue.send(() => this.connection.getBatteryVoltage());
  }

  async reboot() {
    return this.queue.send(() => this.connection.reboot());
  }

  // --- Security / Signing ---
  async exportPrivateKey() {
    return this.queue.send(() => this.connection.exportPrivateKey());
  }

  async importPrivateKey(privateKey) {
    return this.queue.send(() => this.connection.importPrivateKey(privateKey));
  }

  async signStart() {
    return this.queue.send(() => this.connection.signStart());
  }

  async signData(dataToSign) {
    return this.queue.send(() => this.connection.signData(dataToSign));
  }

  async signFinish() {
    return this.queue.send(() => this.connection.signFinish());
  }

  startLoop(label, fn, interval = 10000) {
    this.queue.startLoop(label, fn, interval)
  }
  stopLoop(label) {
    this.queue.stopLoop(label);
  }
  close() {
    this.connection.close();
    if (super.close)
      super.close();
  }
}

