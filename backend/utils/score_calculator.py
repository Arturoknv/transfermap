from datetime import datetime
from utils.database import get_rows, execute
import json

def salva_score(entita_tipo, entita_id, entita_id_2, tipo_score,
                stagione, finestra_temporale, valore, operazioni_base, dettaglio):
    execute("""
        INSERT INTO score_concentrazione
        (entita_tipo, entita_id, entita_id_2, tipo_score,
         finestra_temporale, valore, operazioni_base, dettaglio, calcolato_il)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [entita_tipo, entita_id, entita_id_2, tipo_score,
          finestra_temporale, valore, operazioni_base,
          json.dumps(dettaglio) if dettaglio else None,
          datetime.now().isoformat()])

def calcola_idp():
    """IDP — Indice DS-Procuratore"""
    print("  📊 Calcolo IDP...")
    ds_list = get_rows("""
        SELECT ds_id, COUNT(*) as totale
        FROM trasferimenti_ufficiali
        WHERE ds_id IS NOT NULL AND procuratore_id IS NOT NULL
        GROUP BY ds_id
        HAVING totale >= 5
    """)
    for ds in ds_list:
        ds_id = ds["ds_id"]
        totale = int(ds["totale"])
        proc_counts = get_rows("""
            SELECT procuratore_id, COUNT(*) as cnt
            FROM trasferimenti_ufficiali
            WHERE ds_id = ? AND procuratore_id IS NOT NULL
            GROUP BY procuratore_id
            ORDER BY cnt DESC
            LIMIT 1
        """, [ds_id])
        if not proc_counts:
            continue
        proc_top = proc_counts[0]
        proc_id = proc_top["procuratore_id"]
        cnt_top = int(proc_top["cnt"])
        valore = round((cnt_top / totale) * 100, 1)
        dettaglio = {
            "procuratore_id": proc_id,
            "operazioni_con_proc_top": cnt_top,
            "operazioni_totali": totale
        }
        salva_score("ds", ds_id, proc_id, "IDP",
                   None, "storico_completo", valore, totale, dettaglio)

def calcola_ipc():
    """IPC — Indice Procuratore-Club"""
    print("  📊 Calcolo IPC...")
    proc_list = get_rows("""
        SELECT procuratore_id, COUNT(*) as totale
        FROM trasferimenti_ufficiali
        WHERE procuratore_id IS NOT NULL AND club_arrivo_id IS NOT NULL
        GROUP BY procuratore_id
        HAVING totale >= 5
    """)
    for proc in proc_list:
        proc_id = proc["procuratore_id"]
        totale = int(proc["totale"])
        club_distinti = get_rows("""
            SELECT COUNT(DISTINCT club_arrivo_id) as cnt
            FROM trasferimenti_ufficiali
            WHERE procuratore_id = ? AND club_arrivo_id IS NOT NULL
        """, [proc_id])
        if not club_distinti:
            continue
        n_club = int(club_distinti[0]["cnt"])
        concentrazione = 1 - (n_club / totale)
        valore = round(max(0, concentrazione) * 100, 1)
        dettaglio = {
            "club_distinti": n_club,
            "operazioni_totali": totale
        }
        salva_score("procuratore", proc_id, None, "IPC",
                   None, "storico_completo", valore, totale, dettaglio)

def calcola_imd():
    """IMD — Indice Mobilità DS"""
    print("  📊 Calcolo IMD...")
    ds_multiclub = get_rows("""
        SELECT ds_id, COUNT(DISTINCT club_arrivo_id) as n_club
        FROM trasferimenti_ufficiali
        WHERE ds_id IS NOT NULL
        GROUP BY ds_id
        HAVING n_club >= 2
    """)
    for ds in ds_multiclub:
        ds_id = ds["ds_id"]
        clubs = get_rows("""
            SELECT DISTINCT club_arrivo_id
            FROM trasferimenti_ufficiali
            WHERE ds_id = ?
        """, [ds_id])
        club_ids = [c["club_arrivo_id"] for c in clubs]
        proc_per_club = {}
        for club_id in club_ids:
            procs = get_rows("""
                SELECT DISTINCT procuratore_id
                FROM trasferimenti_ufficiali
                WHERE ds_id = ? AND club_arrivo_id = ? AND procuratore_id IS NOT NULL
            """, [ds_id, club_id])
            proc_per_club[club_id] = set(p["procuratore_id"] for p in procs)
        if len(club_ids) < 2:
            continue
        tutti_proc = list(proc_per_club.values())
        proc_comuni = tutti_proc[0]
        for s in tutti_proc[1:]:
            proc_comuni = proc_comuni.intersection(s)
        if not proc_comuni:
            continue
        totale_ops = get_rows("""
            SELECT COUNT(*) as cnt
            FROM trasferimenti_ufficiali
            WHERE ds_id = ?
        """, [ds_id])
        totale = int(totale_ops[0]["cnt"])
        ops_comuni = get_rows("""
            SELECT COUNT(*) as cnt
            FROM trasferimenti_ufficiali
            WHERE ds_id = ? AND procuratore_id IN ({})
        """.format(",".join("?" * len(proc_comuni))),
        [ds_id] + list(proc_comuni))
        n_ops_comuni = int(ops_comuni[0]["cnt"])
        valore = round((n_ops_comuni / totale) * 100, 1) if totale > 0 else 0
        dettaglio = {
            "procuratori_comuni": list(proc_comuni),
            "ops_con_proc_comuni": n_ops_comuni,
            "ops_totali": totale,
            "n_club": len(club_ids)
        }
        salva_score("ds", ds_id, None, "IMD",
                   None, "storico_completo", valore, totale, dettaglio)

def calcola_icp():
    """ICP — Indice Club-Procuratore"""
    print("  📊 Calcolo ICP...")
    club_list = get_rows("""
        SELECT club_arrivo_id, COUNT(*) as totale
        FROM trasferimenti_ufficiali
        WHERE club_arrivo_id IS NOT NULL AND procuratore_id IS NOT NULL
        GROUP BY club_arrivo_id
        HAVING totale >= 5
    """)
    for club in club_list:
        club_id = club["club_arrivo_id"]
        totale = int(club["totale"])
        proc_ricorrenti = get_rows("""
            SELECT procuratore_id, COUNT(*) as cnt
            FROM trasferimenti_ufficiali
            WHERE club_arrivo_id = ? AND procuratore_id IS NOT NULL
            GROUP BY procuratore_id
            HAVING cnt >= 3
        """, [club_id])
        if not proc_ricorrenti:
            continue
        ops_ricorrenti = sum(int(p["cnt"]) for p in proc_ricorrenti)
        valore = round((ops_ricorrenti / totale) * 100, 1)
        dettaglio = {
            "procuratori_ricorrenti": len(proc_ricorrenti),
            "ops_ricorrenti": ops_ricorrenti,
            "ops_totali": totale
        }
        salva_score("club", club_id, None, "ICP",
                   None, "storico_completo", valore, totale, dettaglio)

def calcola_icc():
    """ICC — Indice Club-Club"""
    print("  📊 Calcolo ICC...")
    coppie = get_rows("""
        SELECT club_partenza_id, club_arrivo_id, COUNT(*) as scambi
        FROM trasferimenti_ufficiali
        WHERE club_partenza_id IS NOT NULL AND club_arrivo_id IS NOT NULL
        GROUP BY club_partenza_id, club_arrivo_id
        HAVING scambi >= 3
    """)
    for coppia in coppie:
        club1 = coppia["club_partenza_id"]
        club2 = coppia["club_arrivo_id"]
        scambi = int(coppia["scambi"])
        intermediari = get_rows("""
            SELECT COUNT(DISTINCT intermediario_id) as cnt
            FROM trasferimenti_ufficiali
            WHERE club_partenza_id = ? AND club_arrivo_id = ?
            AND intermediario_id IS NOT NULL
        """, [club1, club2])
        n_intermediari = int(intermediari[0]["cnt"]) if intermediari else 0
        freq_norm = min(scambi / 10, 1) * 100
        peso_int = (n_intermediari / scambi * 100) if scambi > 0 else 0
        valore = round(freq_norm * 0.6 + peso_int * 0.4, 1)
        dettaglio = {
            "scambi_totali": scambi,
            "intermediari_comuni": n_intermediari
        }
        salva_score("club", club1, club2, "ICC",
                   None, "storico_completo", valore, scambi, dettaglio)

def calcola_ipp():
    """IPP — Indice Procuratore-Procuratore"""
    print("  📊 Calcolo IPP...")
    proc_list = get_rows("""
        SELECT DISTINCT procuratore_id
        FROM trasferimenti_ufficiali
        WHERE procuratore_id IS NOT NULL
    """)
    for i, proc1 in enumerate(proc_list[:50]):
        p1_id = proc1["procuratore_id"]
        p1_ops = get_rows("""
            SELECT club_arrivo_id, stagione
            FROM trasferimenti_ufficiali
            WHERE procuratore_id = ?
        """, [p1_id])
        if len(p1_ops) < 3:
            continue
        p1_keys = set((o["club_arrivo_id"], o["stagione"]) for o in p1_ops)
        for proc2 in proc_list[i+1:i+20]:
            p2_id = proc2["procuratore_id"]
            p2_ops = get_rows("""
                SELECT club_arrivo_id, stagione
                FROM trasferimenti_ufficiali
                WHERE procuratore_id = ?
            """, [p2_id])
            if len(p2_ops) < 3:
                continue
            p2_keys = set((o["club_arrivo_id"], o["stagione"]) for o in p2_ops)
            comuni = len(p1_keys.intersection(p2_keys))
            if comuni < 2:
                continue
            min_ops = min(len(p1_ops), len(p2_ops))
            valore = round((comuni / min_ops) * 100, 1)
            if valore < 20:
                continue
            dettaglio = {
                "operazioni_comuni": comuni,
                "ops_proc1": len(p1_ops),
                "ops_proc2": len(p2_ops)
            }
            salva_score("procuratore", p1_id, p2_id, "IPP",
                       None, "storico_completo", valore, comuni, dettaglio)

def calcola_iic():
    """IIC — Indice Intermediario-Club"""
    print("  📊 Calcolo IIC...")
    int_list = get_rows("""
        SELECT intermediario_id, COUNT(*) as totale
        FROM trasferimenti_ufficiali
        WHERE intermediario_id IS NOT NULL
        GROUP BY intermediario_id
        HAVING totale >= 3
    """)
    for intermediario in int_list:
        int_id = intermediario["intermediario_id"]
        totale = int(intermediario["totale"])
        club_distinti = get_rows("""
            SELECT COUNT(DISTINCT club_arrivo_id) as cnt
            FROM trasferimenti_ufficiali
            WHERE intermediario_id = ?
        """, [int_id])
        n_club = int(club_distinti[0]["cnt"])
        concentrazione = 1 - (n_club / totale)
        valore = round(max(0, concentrazione) * 100, 1)
        dettaglio = {
            "club_distinti": n_club,
            "operazioni_totali": totale
        }
        salva_score("intermediario", int_id, None, "IIC",
                   None, "storico_completo", valore, totale, dettaglio)

def calcola_icg():
    """ICG — Indice Cluster Geografico"""
    print("  📊 Calcolo ICG...")
    club_regioni = get_rows("""
        SELECT id, nome, regione
        FROM club
        WHERE regione IS NOT NULL
    """)
    regioni = {}
    for club in club_regioni:
        reg = club["regione"]
        if reg not in regioni:
            regioni[reg] = []
        regioni[reg].append(club["id"])
    for regione, club_ids in regioni.items():
        if len(club_ids) < 2:
            continue
        placeholders = ",".join("?" * len(club_ids))
        ops_regione = get_rows(f"""
            SELECT COUNT(*) as cnt
            FROM trasferimenti_ufficiali
            WHERE club_partenza_id IN ({placeholders})
            AND club_arrivo_id IN ({placeholders})
        """, club_ids + club_ids)
        totale_ops = int(ops_regione[0]["cnt"])
        if totale_ops < 3:
            continue
        valore = round(min(totale_ops / 10, 1) * 100, 1)
        dettaglio = {
            "regione": regione,
            "club_in_regione": len(club_ids),
            "ops_interne": totale_ops
        }
        for club_id in club_ids:
            salva_score("club", club_id, None, "ICG",
                       None, "storico_completo", valore, totale_ops, dettaglio)

def run():
    print("🚀 Avvio calcolo score...")
    start = datetime.now()
    execute("DELETE FROM score_concentrazione")
    calcola_idp()
    calcola_ipc()
    calcola_imd()
    calcola_icp()
    calcola_icc()
    calcola_ipp()
    calcola_iic()
    calcola_icg()
    totale = get_rows("SELECT COUNT(*) as cnt FROM score_concentrazione")
    n = int(totale[0]["cnt"])
    execute("""
        UPDATE ultimo_aggiornamento
        SET data_aggiornamento = ?
        WHERE tipo = 'score'
    """, [datetime.now().isoformat()])
    durata = int((datetime.now() - start).total_seconds())
    print(f"\n✅ Score completati in {durata}s — {n} score calcolati")

if __name__ == "__main__":
    run()
