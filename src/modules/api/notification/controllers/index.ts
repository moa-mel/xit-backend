import { Controller } from "@nestjs/common";
import { NotificationService } from "../services";


@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

}