import { Request, Response } from 'express';
import { IBaseController } from '../interfaces/IBaseController';
import { IBaseService } from '../interfaces/IBaseService';

export abstract class BaseController<T> implements IBaseController {
  constructor(protected readonly service: IBaseService<T>) {}

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const entities = await this.service.find({} as any);
      res.json(entities);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const entity = await this.service.findOne({ id } as any);
      if (!entity) {
        res.status(404).json({ message: 'Entity not found' });
        return;
      }
      res.json(entity);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const entity = await this.service.create(req.body);
      res.status(201).json(entity);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const entity = await this.service.update(id, req.body);
      res.json(entity);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.service.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
} 