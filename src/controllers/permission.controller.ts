import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Permission } from '../models/Permission';

export class PermissionController {
  async listPermissions(req: Request, res: Response) {
    const permissions = await getRepository(Permission).find();
    res.json(permissions);
  }

  async getPermission(req: Request, res: Response) {
    const permission = await getRepository(Permission).findOne({ where: { id: req.params.id } });
    if (!permission) return res.status(404).json({ error: 'Permission not found' });
    res.json(permission);
  }

  async createPermission(req: Request, res: Response) {
    const repo = getRepository(Permission);
    const permission = repo.create(req.body);
    await repo.save(permission);
    res.status(201).json(permission);
  }

  async updatePermission(req: Request, res: Response) {
    const repo = getRepository(Permission);
    let permission = await repo.findOne({ where: { id: req.params.id } });
    if (!permission) return res.status(404).json({ error: 'Permission not found' });
    repo.merge(permission, req.body);
    await repo.save(permission);
    res.json(permission);
  }

  async deletePermission(req: Request, res: Response) {
    const repo = getRepository(Permission);
    const permission = await repo.findOne({ where: { id: req.params.id } });
    if (!permission) return res.status(404).json({ error: 'Permission not found' });
    await repo.remove(permission);
    res.json({ success: true });
  }
} 