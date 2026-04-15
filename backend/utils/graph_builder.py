import json
import networkx as nx
from datetime import datetime
from utils.database import get_rows, execute

NODE_COLORS = {
    "procuratore": "#e86b1a",
    "ds": "#1ab854",
    "club": "#e8211a",
    "giocatore": "#1a3de8",
    "intermediario": "#7c1ae8"
}

def build_graph(filtro_campionato=None, filtro_stagione=None):
    print("🕸️ Costruzione grafo...")

    G = nx.Graph()

    # Query trasferimenti
    sql = """
        SELECT t.id, t.giocatore_id, t.club_partenza_id, t.club_arrivo_id,
               t.ds_id, t.procuratore_id, t.intermediario_id,
               t.stagione, t.tipo,
               g.nome as giocatore_nome,
               cp.nome as club_partenza_nome,
               ca.nome as club_arrivo_nome
        FROM trasferimenti_ufficiali t
        LEFT JOIN giocatori g ON t.giocatore_id = g.id
        LEFT JOIN club cp ON t.club_partenza_id = cp.id
        LEFT JOIN club ca ON t.club_arrivo_id = ca.id
        WHERE 1=1
    """
    params = []

    if filtro_campionato:
        sql += " AND ca.campionato = ?"
        params.append(filtro_campionato)
    if filtro_stagione:
        sql += " AND t.stagione = ?"
        params.append(filtro_stagione)

    trasferimenti = get_rows(sql, params if params else None)
    print(f"  → {len(trasferimenti)} trasferimenti trovati")

    # Costruisci nodi e archi
    edge_weights = {}

    for t in trasferimenti:
        # Aggiungi nodi club
        if t["club_arrivo_id"]:
            node_id = f"club_{t['club_arrivo_id']}"
            if not G.has_node(node_id):
                G.add_node(node_id,
                    tipo="club",
                    label=t["club_arrivo_nome"] or "Club",
                    color=NODE_COLORS["club"]
                )

        if t["club_partenza_id"]:
            node_id = f"club_{t['club_partenza_id']}"
            if not G.has_node(node_id):
                G.add_node(node_id,
                    tipo="club",
                    label=t["club_partenza_nome"] or "Club",
                    color=NODE_COLORS["club"]
                )

        # Aggiungi nodo giocatore
        if t["giocatore_id"] and t["giocatore_nome"]:
            node_id = f"giocatore_{t['giocatore_id']}"
            if not G.has_node(node_id):
                G.add_node(node_id,
                    tipo="giocatore",
                    label=t["giocatore_nome"],
                    color=NODE_COLORS["giocatore"]
                )

        # Aggiungi nodo DS
        if t["ds_id"]:
            node_id = f"ds_{t['ds_id']}"
            if not G.has_node(node_id):
                ds = get_rows("SELECT nome FROM direttori_sportivi WHERE id = ?", [t["ds_id"]])
                label = ds[0]["nome"] if ds else "DS"
                G.add_node(node_id,
                    tipo="ds",
                    label=label,
                    color=NODE_COLORS["ds"]
                )

        # Aggiungi nodo procuratore
        if t["procuratore_id"]:
            node_id = f"procuratore_{t['procuratore_id']}"
            if not G.has_node(node_id):
                proc = get_rows("SELECT nome FROM procuratori WHERE id = ?", [t["procuratore_id"]])
                label = proc[0]["nome"] if proc else "Procuratore"
                G.add_node(node_id,
                    tipo="procuratore",
                    label=label,
                    color=NODE_COLORS["procuratore"]
                )

        # Aggiungi archi con peso
        def add_edge(n1, n2):
            key = tuple(sorted([n1, n2]))
            edge_weights[key] = edge_weights.get(key, 0) + 1

        # Archi principali
        if t["club_partenza_id"] and t["club_arrivo_id"]:
            add_edge(f"club_{t['club_partenza_id']}", f"club_{t['club_arrivo_id']}")

        if t["giocatore_id"] and t["club_arrivo_id"]:
            add_edge(f"giocatore_{t['giocatore_id']}", f"club_{t['club_arrivo_id']}")

        if t["ds_id"] and t["club_arrivo_id"]:
            add_edge(f"ds_{t['ds_id']}", f"club_{t['club_arrivo_id']}")

        if t["procuratore_id"] and t["ds_id"]:
            add_edge(f"procuratore_{t['procuratore_id']}", f"ds_{t['ds_id']}")

        if t["procuratore_id"] and t["club_arrivo_id"]:
            add_edge(f"procuratore_{t['procuratore_id']}", f"club_{t['club_arrivo_id']}")

    # Aggiungi archi al grafo con pesi
    for (n1, n2), peso in edge_weights.items():
        if G.has_node(n1) and G.has_node(n2):
            G.add_edge(n1, n2, weight=peso)

    print(f"  → {G.number_of_nodes()} nodi, {G.number_of_edges()} archi")

    # Calcola metriche NetworkX
    try:
        betweenness = nx.betweenness_centrality(G, weight="weight")
        degree = dict(G.degree(weight="weight"))
        clustering = nx.clustering(G, weight="weight")
    except Exception as e:
        print(f"  ⚠️ Errore metriche: {e}")
        betweenness = {}
        degree = {}
        clustering = {}

    # Serializza per frontend D3.js
    nodes = []
    for node_id, data in G.nodes(data=True):
        nodes.append({
            "id": node_id,
            "tipo": data.get("tipo", "unknown"),
            "label": data.get("label", node_id),
            "color": data.get("color", "#999"),
            "size": min(30, 8 + (degree.get(node_id, 0) * 2)),
            "betweenness": round(betweenness.get(node_id, 0) * 100, 2),
            "clustering": round(clustering.get(node_id, 0) * 100, 2),
            "degree": degree.get(node_id, 0)
        })

    edges = []
    for n1, n2, data in G.edges(data=True):
        peso = data.get("weight", 1)
        edges.append({
            "source": n1,
            "target": n2,
            "weight": peso,
            "score": min(100, peso * 15)
        })

    result = {
        "nodes": nodes,
        "edges": edges,
        "meta": {
            "totale_nodi": len(nodes),
            "totale_archi": len(edges),
            "calcolato_il": datetime.now().isoformat(),
            "filtro_campionato": filtro_campionato,
            "filtro_stagione": filtro_stagione
        }
    }

    return result

def salva_grafo_cache(grafo_data, filtro_campionato=None, filtro_stagione=None):
    # Rimuovi cache precedente
    execute("""
        DELETE FROM grafo_cache
        WHERE filtro_campionato IS ? AND filtro_stagione IS ?
    """, [filtro_campionato, filtro_stagione])

    execute("""
        INSERT INTO grafo_cache
        (filtro_campionato, filtro_stagione, nodi_json, archi_json, calcolato_il)
        VALUES (?, ?, ?, ?, ?)
    """, [
        filtro_campionato,
        filtro_stagione,
        json.dumps(grafo_data["nodes"]),
        json.dumps(grafo_data["edges"]),
        datetime.now().isoformat()
    ])

def run():
    print("🚀 Avvio generatore grafo...")
    start = datetime.now()

    # Genera grafo principale (Serie A, stagione corrente)
    grafo = build_graph(filtro_campionato="Serie A", filtro_stagione="2024-25")
    salva_grafo_cache(grafo, "Serie A", "2024-25")
    print(f"  ✅ Grafo Serie A 2024-25 salvato")

    # Genera grafo globale (tutti i campionati)
    grafo_globale = build_graph()
    salva_grafo_cache(grafo_globale)
    print(f"  ✅ Grafo globale salvato")

    execute("""
        UPDATE ultimo_aggiornamento
        SET data_aggiornamento = ?
        WHERE tipo = 'grafo'
    """, [datetime.now().isoformat()])

    durata = int((datetime.now() - start).total_seconds())
    print(f"\n✅ Grafo completato in {durata}s")
    print(f"   Serie A: {grafo['meta']['totale_nodi']} nodi, {grafo['meta']['totale_archi']} archi")
    print(f"   Globale: {grafo_globale['meta']['totale_nodi']} nodi, {grafo_globale['meta']['totale_archi']} archi")

if __name__ == "__main__":
    run()
