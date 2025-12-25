import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { CalendarPlus } from "lucide-react";

interface EventoIgreja {
    id: string;
    titulo: string;
    data: any;
    local?: string;
}

export default function PublicEvents() {
    const [eventos, setEventos] = useState<EventoIgreja[]>([]);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const gerarLinkAgenda = (evento: any) => {
        const data = evento.data?.toDate();
        if (!data) return "#";
        const dataFormatada = data.toISOString().replace(/-|:|\.\d+/g, "");
        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(evento.titulo)}&dates=${dataFormatada}/${dataFormatada}`;
    };

    useEffect(() => {
        const q = query(collection(db, "eventos"), orderBy("data", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            const todosEventos = snap.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as any)
            }));

            const eventosFuturos = todosEventos.filter(evento => {
                const dataEvento = evento.data?.toDate();
                return dataEvento >= hoje;
            });
            setEventos(eventosFuturos);
        });
        return () => unsub();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
            {eventos.map(evento => (
                <div key={evento.id} className="glass p-8 rounded-[3rem] border border-white/5">
                    <h3 className="text-destaque font-black uppercase mb-4">{evento.titulo}</h3>
                    <a href={gerarLinkAgenda(evento)} target="_blank" className="bg-white/5 p-4 rounded-2xl flex items-center gap-2 text-xs uppercase font-bold hover:bg-white/10 transition-all">
                        <CalendarPlus size={14} /> Salvar na Agenda
                    </a>
                </div>
            ))}
        </div>
    );
}