import { schedule } from '@netlify/functions';
import { db } from '../../src/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler = schedule('0 3 * * 1', async () => {
    try {
        const snapshot = await getDocs(collection(db, "registros_dizimos"));
        const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (dados.length === 0) return { statusCode: 200 };

        // Cálculo para auditoria: D = V_ativo - V_backup
        const totalSemeado = dados.reduce((acc, d: any) => acc + Number(d.valor || 0), 0);
        const backupJson = JSON.stringify(dados, null, 2);
        const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

        await addDoc(collection(db, "backup_metadata"), {
            dataBackup: dataAtual,
            valorTotalNoMomento: totalSemeado,
            quantidadeRegistros: snapshot.size,
            criadoEm: serverTimestamp()
        });

        await resend.emails.send({
            from: 'Sistema Famílias Church <backup@familiaschurch.org>',
            to: 'tesouraria@familiaschurch.org',
            subject: `📦 Backup Financeiro - ${dataAtual}`,
            html: `<p>Backup automático realizado. Total processado: R$ ${totalSemeado}</p>`,
            attachments: [
                {
                    filename: `backup-financas-${dataAtual}.json`,
                    content: Buffer.from(backupJson).toString('base64'),
                },
            ],
        });

        return { statusCode: 200 };
    } catch (error) {
        return { statusCode: 500 };
    }
});