import { Body, Controller, Post, Request, Get, ParseIntPipe, Param, UseGuards, Query } from "@nestjs/common";
import { PodCastService } from "../services";
import { CreatePodCastDto, ListenToPodcastDto, PaginationDto } from "../dtos";
import { AuthGuard } from "../../auth/guards";

@UseGuards(AuthGuard)
@Controller({
  path: 'podcast',
})

export class PodCastController {
  constructor(private readonly podCastService: PodCastService) { }

  @Post('create')
  async create(@Request() req, @Body() dto: CreatePodCastDto) {
    return this.podCastService.createPodcast(req.user, dto);
  }

  // Get all podcasts
  @Get('all')
  async getPodcast(@Query() dto: PaginationDto) {
    return this.podCastService.getPodcast(dto);
  }

  // Get podcast by id
  @Get(':id')
  async getPodcastById(@Param('id', ParseIntPipe) id: number) {
    return this.podCastService.getPodcastById(id);
  }




  // Listen to podcast
  @Post('listen/:id')
  async listenToPodcast(@Request() req, @Param('id') podcastId: number, @Body('sessionId') sessionId?: string
  ) {
    return this.podCastService.listenToPodcast(+podcastId, req.user?.id, sessionId);
  }



}