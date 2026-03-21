import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ArrivalInfo } from '../../domain/use-cases/get-school-arrivals.use-case';

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class ArrivalsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ArrivalsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(socket: Socket) {
    try {
      // Extract JWT from handshake query
      const token = socket.handshake.auth?.token;

      if (!token) {
        this.logger.warn('Connection attempt without token');
        socket.disconnect();
        return;
      }

      // Validate JWT
      try {
        const payload = this.jwtService.verify(token);
        socket.data.parentId = payload.sub;
        socket.data.email = payload.email;
        this.logger.log(`Parent ${payload.sub} connected from ${socket.id}`);
      } catch (error) {
        this.logger.warn(`Invalid token: ${error.message}`);
        socket.disconnect();
        return;
      }
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(
      `Parent ${socket.data.parentId} disconnected (${socket.id})`,
    );
  }

  @SubscribeMessage('school:join')
  handleSchoolJoin(socket: Socket, data: { schoolId: string }) {
    const roomName = `school:${data.schoolId}`;
    socket.join(roomName);
    this.logger.log(`Parent ${socket.data.parentId} joined room ${roomName}`);
    return { success: true, room: roomName };
  }

  @SubscribeMessage('school:leave')
  handleSchoolLeave(socket: Socket, data: { schoolId: string }) {
    const roomName = `school:${data.schoolId}`;
    socket.leave(roomName);
    this.logger.log(`Parent ${socket.data.parentId} left room ${roomName}`);
    return { success: true, room: roomName };
  }

  /**
   * Emits arrivals:updated event to a school's room
   * Called by LocationsService after ETA calculation
   */
  emitArrivalsUpdated(
    schoolId: string,
    arrivals: ArrivalInfo[],
    schoolName: string,
  ) {
    const roomName = `school:${schoolId}`;

    const payload = {
      schoolId,
      schoolName,
      totalCount: arrivals.length,
      arrivals: arrivals.map((arrival) => ({
        parentId: arrival.parentId,
        parentName: arrival.parentName,
        lat: arrival.lat,
        lng: arrival.lng,
        etaMinutes: arrival.etaMinutes,
        distanceMeters: arrival.distanceMeters,
        calculatedAt: arrival.calculatedAt,
      })),
      timestamp: new Date(),
    };

    this.server.to(roomName).emit('arrivals:updated', payload);
    this.logger.debug(
      `Emitted arrivals:updated to ${roomName} with ${arrivals.length} arrivals`,
    );
  }
}
