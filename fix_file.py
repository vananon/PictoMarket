import sys

with open('c:/Users/vanes/PictoMarket/codigo/frontend/app_pictomarket.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.startswith('with col_juego:'):
        start_idx = i
        break

correct_ending = """with col_juego:
    if not st.session_state.items_restantes:
        pantalla_final(reto_actual)
    else:
        burbuja_agente()
        matriz_productos()

with col_lateral:
    panel_lista_compras(reto_actual)
    panel_billetera(reto_actual)
    panel_carrito()
    panel_terapeuta()

st.markdown("<p style='text-align:center;font-size:12px;margin-top:10px'>Pictogramas: Sergio Palao. "
            "Origen: ARASAAC (arasaac.org). Licencia CC BY-NC-SA. Propiedad: Gobierno de Aragón.</p>",
            unsafe_allow_html=True)
"""

with open('c:/Users/vanes/PictoMarket/codigo/frontend/app_pictomarket.py', 'w', encoding='utf-8') as f:
    f.writelines(lines[:start_idx])
    f.write(correct_ending)

print("Done")
