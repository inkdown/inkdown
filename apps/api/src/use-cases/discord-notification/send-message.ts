import axios from "axios";
import { env } from "@inkdown/env"; 

export async function sendMessageUsecase(content: string): Promise<boolean> {
    try {
      const response = await axios.post(env.DISCORD_WEBHOOK, {
        content,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(response);

      console.log('✅ Mensagem enviada com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      return false;
    }
}
