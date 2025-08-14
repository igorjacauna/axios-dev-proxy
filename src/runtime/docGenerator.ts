interface MockResponse {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
}

interface MockEndpoint {
  method: string;
  path: string;
  response: MockResponse;
}

interface OpenAPI {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paths: Record<string, any>;
}

export class DocGenerator {
  private mocks: MockEndpoint[] = [];

  private filename: string;

  constructor(filename = 'openapi.json') {
    this.filename = filename;
  }

  /**
   * Adiciona um novo mock e automaticamente atualiza o JSON de documentação
   * @param method - Método HTTP (GET, POST, etc.)
   * @param path - Endpoint da API
   * @param status - Código de status HTTP da resposta
   * @param body - Corpo da resposta
   */
  public addMock(
    method: string,
    path: string,
    status: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any,
  ): void {
    // Verifica se já existe um mock com o mesmo método e path para evitar duplicação
    const existingMockIndex = this.mocks.findIndex(
      mock => mock.method === method.toUpperCase() && mock.path === path,
    );

    if (existingMockIndex !== -1) {
      // Se já existe, atualiza o mock existente
      this.mocks[existingMockIndex] = {
        method: method.toUpperCase(),
        path,
        response: { status, body },
      };
    } else {
      // Caso contrário, adiciona um novo mock
      this.mocks.push({
        method: method.toUpperCase(),
        path,
        response: { status, body },
      });
    }

    // Regenera a documentação automaticamente
    this.generateOpenApiJson();
  }

  /**
   * Gera o JSON de documentação OpenAPI e salva no arquivo definido no construtor
   */
  private generateOpenApiJson(): void {
    const openAPI: OpenAPI = {
      openapi: '3.0.0',
      info: {
        title: 'Mocked API',
        version: '1.0.0',
      },
      paths: {},
    };

    // Construindo os endpoints no formato OpenAPI
    this.mocks.forEach(({ method, path, response }) => {
      if (!openAPI.paths[path]) {
        openAPI.paths[path] = {};
      }

      openAPI.paths[path][method.toLowerCase()] = {
        summary: `Mock response for ${method} ${path}`,
        responses: {
          [response.status]: {
            description: `Mock response for ${method} ${path}`,
            content: {
              'application/json': response.body,
            },
          },
        },
      };
    });

    console.log('\n\n## OpenAPI JSON ##');
    console.log(JSON.stringify(openAPI, null, 2));
    console.log('\n\n');
  }
}
