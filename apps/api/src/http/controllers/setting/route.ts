import { FastifyInstance } from "fastify";
import { updateSetting } from "./update-setting";

export async function settingRoute(instance: FastifyInstance) {

  instance.put("/update", updateSetting);
}
