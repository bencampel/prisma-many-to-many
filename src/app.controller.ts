import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Post, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  async propiedades() {
    return await this.prisma.propiedad.findMany({include: {tagsOnPropiedad: {include: {tag: true}}}});
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async crearPropiedad(@Body() body: any){
    
    // si hay tags crear un array de objectos del tipo [{tag: {connect: {id: tagId}}}] sino array vacio
    const tags = body.tagsIds 
      ? JSON.parse(body.tagsIds)?.map(tagId => ({tag: {connect: {id: +tagId}}}))
      : [] 

    return await this.prisma.propiedad.create({
      data: {
        nombre: body.nombre,
        tagsOnPropiedad: { create: tags } // crea registros en la tabla intermedia tagsOnPropiedad con el id el tag y el id de la propiedad nueva
      }
    })
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async editarPropiedad(@Param('id') id, @Body() body: any){
    // traigo la propiedad si no existe devolver error
    const oldPropiedad = await this.prisma.propiedad.findUnique({where: {id: +id}, include: {tagsOnPropiedad: {include: {tag: true}}}})
    if(!oldPropiedad) throw new HttpException("no encontrado", HttpStatus.NOT_FOUND);

    //eliminamos relaciones anteriores para crear nuevas // mas facil por ahora
    await this.prisma.tagsOnPropiedad.deleteMany({where: {propiedadId: oldPropiedad.id}});

    // // si hay tags crear un array de objectos del tipo [{tag: {connect: {id: tagId}}}] sino array vacio
    const tags = body.tagsIds 
      ? JSON.parse(body.tagsIds)?.map(tagId => ({tag: {connect: {id: +tagId}}}))
      : [] 

    return await this.prisma.propiedad.update({
      where: {id: oldPropiedad.id},
      data: {
        nombre: body.nombre,
        tagsOnPropiedad: { create: tags } // crea registros en la tabla intermedia tagsOnPropiedad con el id el tag y el id de la propiedad nueva
      }
    })
  }
}
