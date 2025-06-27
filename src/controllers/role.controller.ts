import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Role } from '../models/Role';

export class RoleController {
  async listRoles(req: Request, res: Response) {
    const roles = await getRepository(Role).find();
    res.json(roles);
  }

  async getRole(req: Request, res: Response) {
    const role = await getRepository(Role).findOne({ where: { id: req.params.id } });
    if (!role) return res.status(404).json({ error: 'Role not found' });
    res.json(role);
  }

  async createRole(req: Request, res: Response) {
    const repo = getRepository(Role);
    const role = repo.create(req.body);
    await repo.save(role);
    res.status(201).json(role);
  }

  async updateRole(req: Request, res: Response) {
    const repo = getRepository(Role);
    let role = await repo.findOne({ where: { id: req.params.id } });
    if (!role) return res.status(404).json({ error: 'Role not found' });
    repo.merge(role, req.body);
    await repo.save(role);
    res.json(role);
  }

  async deleteRole(req: Request, res: Response) {
    const repo = getRepository(Role);
    const role = await repo.findOne({ where: { id: req.params.id } });
    if (!role) return res.status(404).json({ error: 'Role not found' });
    await repo.remove(role);
    res.json({ success: true });
  }
} 