import { initAuthCreds, BufferJSON, AuthenticationState, SignalDataTypeMap, proto } from '@whiskeysockets/baileys';
import { PrismaService } from './prisma.service';

export const usePrismaAuthState = async (prisma: PrismaService): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> => {
  const writeData = async (data: any, key: string) => {
    const dataString = JSON.stringify(data, BufferJSON.replacer);
    await prisma.whatsappSession.upsert({
      where: { id: key },
      update: { data: dataString },
      create: { id: key, data: dataString },
    });
  };

  const readData = async (key: string) => {
    try {
      const row = await prisma.whatsappSession.findUnique({ where: { id: key } });
      if (row && row.data) {
        return JSON.parse(row.data, BufferJSON.reviver);
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const removeData = async (key: string) => {
    try {
      await prisma.whatsappSession.delete({ where: { id: key } });
    } catch (error) {
      // Ignore if not found
    }
  };

  const creds = await readData('creds') || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [key: string]: SignalDataTypeMap[typeof type] } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category as keyof typeof data]) {
              const value = data[category as keyof typeof data]![id];
              const key = `${category}-${id}`;
              if (value) {
                tasks.push(writeData(value, key));
              } else {
                tasks.push(removeData(key));
              }
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => writeData(creds, 'creds'),
  };
};
