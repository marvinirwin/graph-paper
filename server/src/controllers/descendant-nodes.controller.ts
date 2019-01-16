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
import {VNestedSetsGraphSourceNodeRepository} from '../repositories';
import {VNestedSetsGraphSourceNode} from '../models/v-nested-sets-graph-source-node.model';

export class DescendantNodesController {
  constructor(
    @repository(VNestedSetsGraphSourceNodeRepository)
    public vNestedSetsGraphSourceNodeRepository : VNestedSetsGraphSourceNodeRepository,
  ) {}

  @post('/vnested-sets-graph-source-nodes', {
    responses: {
      '200': {
        description: 'VNestedSetsGraphSourceNode model instance',
        content: {'application/json': {schema: {'x-ts-type': VNestedSetsGraphSourceNode}}},
      },
    },
  })
  async create(@requestBody() vNestedSetsGraphSourceNode: VNestedSetsGraphSourceNode): Promise<VNestedSetsGraphSourceNode> {
    return await this.vNestedSetsGraphSourceNodeRepository.create(vNestedSetsGraphSourceNode);
  }

  @get('/vnested-sets-graph-source-nodes/count', {
    responses: {
      '200': {
        description: 'VNestedSetsGraphSourceNode model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(VNestedSetsGraphSourceNode)) where?: Where,
  ): Promise<Count> {
    return await this.vNestedSetsGraphSourceNodeRepository.count(where);
  }

  @get('/vnested-sets-graph-source-nodes', {
    responses: {
      '200': {
        description: 'Array of VNestedSetsGraphSourceNode model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': VNestedSetsGraphSourceNode}},
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(VNestedSetsGraphSourceNode)) filter?: Filter,
  ): Promise<VNestedSetsGraphSourceNode[]> {
    return await this.vNestedSetsGraphSourceNodeRepository.find(filter);
  }

  @patch('/vnested-sets-graph-source-nodes', {
    responses: {
      '200': {
        description: 'VNestedSetsGraphSourceNode PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody() vNestedSetsGraphSourceNode: VNestedSetsGraphSourceNode,
    @param.query.object('where', getWhereSchemaFor(VNestedSetsGraphSourceNode)) where?: Where,
  ): Promise<Count> {
    return await this.vNestedSetsGraphSourceNodeRepository.updateAll(vNestedSetsGraphSourceNode, where);
  }

  @get('/vnested-sets-graph-source-nodes/{id}', {
    responses: {
      '200': {
        description: 'VNestedSetsGraphSourceNode model instance',
        content: {'application/json': {schema: {'x-ts-type': VNestedSetsGraphSourceNode}}},
      },
    },
  })
  async findById(@param.path.number('id') id: number): Promise<VNestedSetsGraphSourceNode> {
    return await this.vNestedSetsGraphSourceNodeRepository.findById(id);
  }

  @patch('/vnested-sets-graph-source-nodes/{id}', {
    responses: {
      '204': {
        description: 'VNestedSetsGraphSourceNode PATCH success',
      },
    },
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody() vNestedSetsGraphSourceNode: VNestedSetsGraphSourceNode,
  ): Promise<void> {
    await this.vNestedSetsGraphSourceNodeRepository.updateById(id, vNestedSetsGraphSourceNode);
  }

  @put('/vnested-sets-graph-source-nodes/{id}', {
    responses: {
      '204': {
        description: 'VNestedSetsGraphSourceNode PUT success',
      },
    },
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() vNestedSetsGraphSourceNode: VNestedSetsGraphSourceNode,
  ): Promise<void> {
    await this.vNestedSetsGraphSourceNodeRepository.replaceById(id, vNestedSetsGraphSourceNode);
  }

  @del('/vnested-sets-graph-source-nodes/{id}', {
    responses: {
      '204': {
        description: 'VNestedSetsGraphSourceNode DELETE success',
      },
    },
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.vNestedSetsGraphSourceNodeRepository.deleteById(id);
  }
}
