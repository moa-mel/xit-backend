import { Controller } from "@nestjs/common";
import { LiveStreamService } from "../services";

@Controller({
  path: 'stream',
})

export class LiveStreamController {
  constructor(private readonly liveStreamService: LiveStreamService) { }
  
}