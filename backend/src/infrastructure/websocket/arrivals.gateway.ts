import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { GetArrivalsQueueUseCase } from '../../domain/use-cases/get-arrivals-queue.use-case';

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: '*', // In production, restrict to specific origins
    credentials: true,
  },
})
export class ArrivalsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ArrivalsGateway.name);
  private readonly connectedClients = new Map<string, string>(); // socketId -> schoolId

  constructor(
    private readonly jwtService: JwtService,
    private readonly getArrivalsQueueUseCase: GetArrivalsQueueUseCase,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake auth
      const token =
        client.handshake.auth?.token || client.handshake.headers?.authorization;

      if (!token) {
        this.logger.warn(
          `Client ${client.id} attempted connection without token`,
        );
        client.disconnect();
        return;
      }

      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace('Bearer ', '');

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(cleanToken);

      // Store the connection
      this.logger.log(`Client ${client.id} connected (user: ${payload.sub})`);

      // You could store user info if needed
      // client.data.userId = payload.sub;
      // client.data.email = payload.email;
    } catch (error) {
      this.logger.error(
        `Authentication failed for client ${client.id}:`,
        error.message,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const schoolId = this.connectedClients.get(client.id);

    if (schoolId) {
      this.logger.log(
        `Client ${client.id} disconnected from school ${schoolId}`,
      );
      this.connectedClients.delete(client.id);
    } else {
      this.logger.log(`Client ${client.id} disconnected`);
    }
  }

  @SubscribeMessage('join-school')
  async handleJoinSchool(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { schoolId: string },
  ) {
    try {
      const { schoolId } = data;

      if (!schoolId) {
        client.emit('error', { message: 'schoolId is required' });
        return;
      }

      // Leave any previous school room
      const previousSchoolId = this.connectedClients.get(client.id);
      if (previousSchoolId) {
        client.leave(`school:${previousSchoolId}`);
        this.logger.log(`Client ${client.id} left school ${previousSchoolId}`);
      }

      // Join new school room
      client.join(`school:${schoolId}`);
      this.connectedClients.set(client.id, schoolId);

      this.logger.log(`Client ${client.id} joined school ${schoolId}`);

      // Send current arrivals queue to the client
      const arrivals = await this.getArrivalsQueueUseCase.execute({
        schoolId,
        limit: 50, // Reasonable limit for real-time updates
      });

      client.emit('arrivals:updated', {
        schoolId,
        arrivals: arrivals.arrivals,
      });
    } catch (error) {
      this.logger.error(`Error joining school room:`, error.message);
      client.emit('error', { message: 'Failed to join school room' });
    }
  }

  @SubscribeMessage('leave-school')
  handleLeaveSchool(@ConnectedSocket() client: Socket) {
    const schoolId = this.connectedClients.get(client.id);

    if (schoolId) {
      client.leave(`school:${schoolId}`);
      this.connectedClients.delete(client.id);
      this.logger.log(`Client ${client.id} left school ${schoolId}`);
      client.emit('left-school', { schoolId });
    }
  }

  /**
   * Emit arrivals update to all clients in a school room
   */
  async emitArrivalsUpdate(schoolId: string) {
    try {
      // Get updated arrivals queue
      const arrivals = await this.getArrivalsQueueUseCase.execute({
        schoolId,
        limit: 50,
      });

      // Emit to all clients in the school room
      this.server.to(`school:${schoolId}`).emit('arrivals:updated', {
        schoolId,
        arrivals: arrivals.arrivals,
      });

      this.logger.log(
        `Emitted arrivals update for school ${schoolId} to ${this.server.sockets.adapter.rooms.get(`school:${schoolId}`)?.size || 0} clients`,
      );
    } catch (error) {
      this.logger.error(
        `Error emitting arrivals update for school ${schoolId}:`,
        error.message,
      );
    }
  }

  /**
   * Get number of connected clients for a school
   */
  getConnectedClientsCount(schoolId: string): number {
    const room = this.server.sockets.adapter.rooms.get(`school:${schoolId}`);
    return room ? room.size : 0;
  }
}
