
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, BookText, FileQuestion } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const contactMethods = [
    {
        icon: <Phone className="h-8 w-8 text-primary" />,
        title: 'WhatsApp',
        description: 'Converse em tempo real com nossa equipe de suporte.',
        actionText: 'Iniciar Conversa',
        href: 'https://wa.me/5562998554529',
    },
    {
        icon: <Mail className="h-8 w-8 text-primary" />,
        title: 'E-mail',
        description: 'Envie sua dúvida detalhada e receba uma resposta completa.',
        actionText: 'Enviar E-mail',
        href: 'mailto:geovanisilvadeoliveira447@gmail.com',
    },
];

const faqs = [
    {
        question: 'Como faço para importar notas fiscais (XML)?',
        answer: 'No menu lateral, vá para a seção "Fiscal". Lá você encontrará a opção "Importar XML". Você pode arrastar os arquivos para a área indicada ou clicar para selecioná-los em seu computador.',
    },
    {
        question: 'Como a IA sugere as contas na conciliação de extrato?',
        answer: 'A inteligência artificial analisa o histórico de transações, a descrição do lançamento e os saldos atuais das contas contábeis para sugerir a categorização mais provável. Lembre-se sempre de revisar as sugestões antes de confirmar.',
    },
    {
        question: 'Posso cadastrar múltiplos usuários para minha empresa?',
        answer: 'Sim! O plano Empresarial permite o cadastro de múltiplos usuários com diferentes perfis de acesso. Você pode gerenciar as permissões na tela de "Usuários e Perfis".',
    },
    {
        question: 'O que fazer se um serviço do governo estiver offline?',
        answer: 'Você pode verificar o status dos serviços em tempo real na tela "Conectividade" ou "Utilitários > Status de Serviços". Se um serviço estiver offline, recomendamos aguardar a normalização antes de tentar enviar declarações ou notas fiscais relacionadas a ele.',
    },
];

export default function SuportePage() {
    return (
        <div className="space-y-8">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Central de Ajuda e Suporte</h1>
                <p className="text-muted-foreground">
                    Encontre respostas para suas dúvidas ou entre em contato com nossa equipe.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Canais de Atendimento</CardTitle>
                    <CardDescription>Escolha a melhor forma de falar conosco.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contactMethods.map((method) => (
                         <a key={method.title} href={method.href} target="_blank" rel="noopener noreferrer" className="block transition-transform hover:-translate-y-1">
                            <Card className="h-full bg-card hover:bg-muted/50 cursor-pointer">
                                <CardContent className="p-6 flex items-center gap-6">
                                    <div className="p-3 bg-primary/10 rounded-full">
                                        {method.icon}
                                    </div>
                                    <div className='flex-1'>
                                        <h3 className="font-semibold text-lg">{method.title}</h3>
                                        <p className="text-sm text-muted-foreground">{method.description}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </a>
                    ))}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                             <div className="flex items-center gap-3">
                                <FileQuestion className="h-6 w-6 text-primary" />
                                <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
                            </div>
                            <CardDescription>Respostas rápidas para as dúvidas mais comuns.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Accordion type="single" collapsible className="w-full">
                                {faqs.map((faq, index) => (
                                    <AccordionItem key={index} value={`item-${index}`}>
                                        <AccordionTrigger>{faq.question}</AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground">
                                            {faq.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                     <Card className="h-full">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <BookText className="h-6 w-6 text-primary" />
                                <CardTitle>Documentação</CardTitle>
                            </div>
                            <CardDescription>Ainda não disponível.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Em breve, disponibilizaremos uma documentação completa com guias detalhados sobre todas as funcionalidades do sistema para consulta.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
