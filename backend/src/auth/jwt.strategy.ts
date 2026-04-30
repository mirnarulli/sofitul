import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET no configurado'); })(),
    });
  }

  async validate(payload: any) {
    return {
      id:        payload.sub,
      email:     payload.email,
      rolId:     payload.rolId,
      rolCodigo: payload.rolCodigo,
    };
  }
}
