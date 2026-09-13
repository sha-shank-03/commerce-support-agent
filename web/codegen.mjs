import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {buildClientSchema, printSchema, lexicographicSortSchema} from 'graphql';
import {generate} from '@graphql-codegen/cli';
const result=JSON.parse(execFileSync('go',['run','./cmd/server','-schema'],{cwd:'..',encoding:'utf8'}));
writeFileSync('../schema.graphql',printSchema(lexicographicSortSchema(buildClientSchema(result.data)))+'\n');
await generate({schema:'../schema.graphql',documents:'src/operations.graphql',generates:{'src/generated.ts':{plugins:['typescript','typescript-operations','typescript-graphql-request'],config:{useTypeImports:true}}}},true);
