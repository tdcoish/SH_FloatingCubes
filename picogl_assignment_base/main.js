
/**************************************************************************
 * Timothy Coish - pg12timothy
 * Based on assignment base gived by Angelo Pesce.
 * Fractal Cubes
 * End result is blue cubes spinning, with 1/27 having a red glowing spot 
 * in the center.
 *************************************************************************/

var canvas = document.getElementById("webgl-canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var app = PicoGL.createApp(canvas);
app.clearColor(1.0, 1.0, 0.0, 1.0);

// now modify these so they're between -1 and 1.
var planeSubdivisions = 16;
var planeVertices = new Float32Array( planeSubdivisions * planeSubdivisions * 3 );{
    var idx = 0;
    for( var y=0; y<planeSubdivisions; y++ ){
        for( var x=0; x<planeSubdivisions; x++ ){
            planeVertices[idx++] = -1 + (2/(planeSubdivisions-1) * x);
            planeVertices[idx++] = -1 + (2/(planeSubdivisions-1) * y);
            planeVertices[idx++] = 0.0;
            // planeVertices[idx++] = Math.random()/10;
        }
    }
}
var positions = app.createVertexBuffer( PicoGL.FLOAT, 3, planeVertices );

// taken from example code in assignment pdf
var planeIndices = new Uint16Array( (planeSubdivisions - 1) * (planeSubdivisions - 1) * 2 * 3 );
{
    var numQuads = planeSubdivisions - 1;
    var idx = 0;
    for( var y=0; y<numQuads; y++ ){
        for( var x=0; x<numQuads; x++ ){
            var i = y * planeSubdivisions + x;
            planeIndices[idx++] = i;
            planeIndices[idx++] = i + planeSubdivisions;
            planeIndices[idx++] = i + 1;
            planeIndices[idx++] = i + 1;
            planeIndices[idx++] = i + planeSubdivisions;
            planeIndices[idx++] = i + planeSubdivisions + 1;
        }
    }
}

var indices = app.createIndexBuffer(PicoGL.UNSIGNED_SHORT, 3, planeIndices);

var planeArray = app.createVertexArray()
.vertexAttributeBuffer(0, positions)
.indexBuffer(indices);


var vertexShaderSource = document.getElementById("test_vs").text.trim();
var fragmentShaderSource = document.getElementById("test_fs").text.trim();
var shaders = app.createProgram( vertexShaderSource, fragmentShaderSource );

var uniformBuffer = app.createUniformBuffer([ PicoGL.FLOAT_MAT4, PicoGL.FLOAT_MAT4, PicoGL.FLOAT_MAT4, PicoGL.FLOAT, PicoGL.FLOAT ]);

var drawObject = app.createDrawCall( shaders, planeArray );
drawObject.uniformBlock("ShaderGlobals", uniformBuffer );

// -----------------------------------

// eyePosition and perspective had to be adjusted to show more on screen
var projMat = mat4.create();
mat4.perspective(projMat, Math.PI / 2, canvas.width / canvas.height, 0.1, 100.0);

var eyePosition = vec3.fromValues(0, 0, -10);
var lookAtPos = vec3.fromValues(0, 0, 0);
var lookUpVec = vec3.fromValues(0, 1, 0);
var viewMat = mat4.create();
mat4.lookAt(viewMat, eyePosition, lookAtPos, lookUpVec);

var modelMat = mat4.create(); // create by default makes an identity matrix

// Set transforms into the globals
uniformBuffer.set(0, modelMat);
uniformBuffer.set(1, viewMat);
uniformBuffer.set(2, projMat);

// -----------------------------------

var time = 0.0;
var glow = 0.0;
var glowInd = 0;
// app.drawBackfaces();
app.cullBackfaces();
app.depthTest();

function frameDraw() {
    // Time is already in seconds.
    time = window.performance.now() * 0.001; // https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
    app.clear();

    uniformBuffer.set(3, time); // update the first slot, the float (iTime) 

    glow += 0.015;
    if(glow > 1){
        glow = 0;
        // why 9 when there are 27 cubes?
        glowInd = Math.floor(Math.random() * 9);
        // ah I see, only want the ones we can actually see.
        glowInd*=3;
    }
    
    var rotAxis1 = vec3.fromValues(1, 1, 1);
    
    // had to "push" the cubes away from each other more than 1.0
    var scl = 3;
    
    for(var x=0; x<3; x++){
        for(var y=0; y<3; y++){
            for(var z=0; z<3; z++){
                
                // alright, here we've got to render our face 6 times to make a cube.
                for(var i=0; i<6; i++){
                    modelMat = mat4.create(); // create by default makes an identity matrix

                    // maybe comment this out, because it can hide the front cubes that are lighting up.
                    mat4.rotate(modelMat, modelMat, time*0.15, vec3.fromValues(1, 1, 1));
                    
                    mat4.translate(modelMat, modelMat, vec3.fromValues((x-1)*scl, (y-1)*scl, (z-1)*scl));
                    
                    // makes everything look very jumbled and messy.
                    // mat4.rotate(modelMat, modelMat, time * 0.33, rotAxis1);
                    
                    // first four do around x axis, next two around y axis.
                    if(i < 4){
                        // takes the angle in rads
                        mat4.rotateX(modelMat, modelMat, Math.PI/2*i);
                    }else if (i == 4){
                        mat4.rotateY(modelMat, modelMat, Math.PI/2);       
                    }else if (i == 5){
                        mat4.rotateY(modelMat, modelMat, 3*Math.PI/2);
                    }
                    
                    // Here we have to seperate them in some axis, z, before rotating them around their old center
                    mat4.translate(modelMat, modelMat, vec3.fromValues(0, 0, -1));
                    
                    uniformBuffer.set(0, modelMat);
                    // set our glow effect from 0-1. only if it's the correct index.
                    uniformBuffer.set(4, -1.0);
                    let ind = x*9 + y*3 + z;
                    if(ind == glowInd)
                        uniformBuffer.set(4, glow);

                    uniformBuffer.update(); // this signals that we finished changing values and the buffer can be sent to the GPU
                
                    drawObject.draw();    
            
                }
            }
        }
    }

    
    requestAnimationFrame( frameDraw );
}

requestAnimationFrame( frameDraw );