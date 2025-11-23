import db from '../db.js';
import { emitChannelUpdate } from '../../servers/sseEmitters.js';


export const insertChannel = (packet) => {

  db.prepare(`
    INSERT OR REPLACE INTO channels (
      channelIdx,
      channelNum,
      nodeNum, 
      protocol,
      name, 
      role, 
      psk,
      options,
      timestamp,
      connId
    ) VALUES (
      @channelIdx,
      @channelNum,
      @nodeNum, 
      @protocol,
      @name, 
      @role, 
      @psk,
      @options,
      @timestamp,
      @connId 
    )
  `).run({
    ...packet,
  });
  emitChannelUpdate({
  ...packet,
  updatedAt: Date.now()
});

};
