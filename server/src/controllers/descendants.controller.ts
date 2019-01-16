import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getFilterSchemaFor,
  getWhereSchemaFor,
  patch,
  put,
  del,
  requestBody,
} from '@loopback/rest';
import {VNestedSetsGraphDescendants} from '../models';
import {VNestedSetsGraphDescendantsRepository} from '../repositories';

export class DescendantsController {
  constructor(
    @repository(VNestedSetsGraphDescendantsRepository)
    public vNestedSetsGraphDescendantsRepository : VNestedSetsGraphDescendantsRepository,
  ) {}

  @post('/vnested-sets-graph-descendants', {
    responses: {
      '200': {
        description: 'VNestedSetsGraphDescendants model instance',
        content: {'application/json': {schema: {'x-ts-type': VNestedSetsGraphDescendants}}},
      },
    },
  })
  async create(@requestBody() vNestedSetsGraphDescendants: VNestedSetsGraphDescendants): Promise<VNestedSetsGraphDescendants> {
    return await this.vNestedSetsGraphDescendantsRepository.create(vNestedSetsGraphDescendants);
  }

  @get('/vnested-sets-graph-descendants/count', {
    responses: {
      '200': {
        description: 'VNestedSetsGraphDescendants model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(VNestedSetsGraphDescendants)) where?: Where,
  ): Promise<Count> {
    return await this.vNestedSetsGraphDescendantsRepository.count(where);
  }

  @get('/vnested-sets-graph-descendants', {
    responses: {
      '200': {
        description: 'Array of VNestedSetsGraphDescendants model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': VNestedSetsGraphDescendants}},
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(VNestedSetsGraphDescendants)) filter?: Filter,
  ): Promise<VNestedSetsGraphDescendants[]> {
    return await this.vNestedSetsGraphDescendantsRepository.find(filter);
  }

  @patch('/vnested-sets-graph-descendants', {
    responses: {
      '200': {
        description: 'VNestedSetsGraphDescendants PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody() vNestedSetsGraphDescendants: VNestedSetsGraphDescendants,
    @param.query.object('where', getWhereSchemaFor(VNestedSetsGraphDescendants)) where?: Where,
  ): Promise<Count> {
    return await this.vNestedSetsGraphDescendantsRepository.updateAll(vNestedSetsGraphDescendants, where);
  }

  @get('/vnested-sets-graph-descendants/{id}', {
    responses: {
      '200': {
        description: 'VNestedSetsGraphDescendants model instance',
        content: {'application/json': {schema: {'x-ts-type': VNestedSetsGraphDescendants}}},
      },
    },
  })
  async findById(@param.path.number('id') id: number): Promise<VNestedSetsGraphDescendants> {
    return await this.vNestedSetsGraphDescendantsRepository.findById(id);
  }

  @patch('/vnested-sets-graph-descendants/{id}', {
    responses: {
      '204': {
        description: 'VNestedSetsGraphDescendants PATCH success',
      },
    },
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody() vNestedSetsGraphDescendants: VNestedSetsGraphDescendants,
  ): Promise<void> {
    await this.vNestedSetsGraphDescendantsRepository.updateById(id, vNestedSetsGraphDescendants);
  }

  @put('/vnested-sets-graph-descendants/{id}', {
    responses: {
      '204': {
        description: 'VNestedSetsGraphDescendants PUT success',
      },
    },
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() vNestedSetsGraphDescendants: VNestedSetsGraphDescendants,
  ): Promise<void> {
    await this.vNestedSetsGraphDescendantsRepository.replaceById(id, vNestedSetsGraphDescendants);
  }

  @del('/vnested-sets-graph-descendants/{id}', {
    responses: {
      '204': {
        description: 'VNestedSetsGraphDescendants DELETE success',
      },
    },
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.vNestedSetsGraphDescendantsRepository.deleteById(id);
  }
}
