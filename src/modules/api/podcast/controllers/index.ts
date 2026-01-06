import { Controller } from "@nestjs/common";
import { PodCastService } from "../services";

@Controller({
  path: 'podcast',
})

export class PodCastController {
  constructor(private readonly podCastService: PodCastService) { }
  
}