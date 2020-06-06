import { Request, Response } from 'express';
import knex from '../database/connection';

class PointsController {
    async index(request: Request, response: Response) {
        const { city, uf, items } = request.query;
        const parsedItems = String(items)
            .split(',')
            .map(item => Number(item.trim()))

        if (parsedItems) {
            const points = await knex('points')
                .where('city', String(city))
                .where('uf', String(uf))
                .distinct()
                .select('points.*')
                return response.json(points)
        } else {
            const points = await knex('points')
                .join('point_items', 'points.id', '=', 'point_items.point_id')
                .whereIn('point_items.item_id', parsedItems)
                .where('city', String(city))
                .where('uf', String(uf))
                .distinct()
                .select('points.*')
                return response.json(points)
        }

    }

    async create(request: Request, response: Response) {
        try {
            const {
                name,
                email,
                whatsapp,
                latitude,
                longitude,
                city,
                uf,
                items
            } = request.body
        
            const trx = await knex.transaction();
        
            const point = {
                image: 'image-fake',
                name,
                email,
                whatsapp,
                latitude,
                longitude,
                city,
                uf
            };
        
            const insertedId = await trx('points').insert(point);
            const point_id = insertedId[0];
        
            const pointItems = items.map((item_id: number) => {
                return ({
                    item_id, 
                    point_id
                });
            })

            await trx('point_items').insert(pointItems);
            await trx.commit()

            return response.json({ id: point_id, ...point })
        } catch (error) {
            return response.json({error: error})
        }
    }

    async show(request: Request, response: Response){
        const { id } = request.params;

        const point = await knex('points').where('id', id).first()

        if (!point){
            return response.status(400).json({message: "Point not found."})
        } 

        const items = await knex('items').join('point_items', 'items.id', '=', 'point_items.item_id').where('point_items.id', id)

        return response.json({point, items})
    }
}

export default PointsController